import { assert, unwrap } from "@shimmer/dev-mode";
import type { Cursor, SimplestDocument } from "@shimmer/dom";
import { Bounds } from "@shimmer/dom";
import {
  Cell,
  diffArray,
  isStaticReactive,
  KeyedNode,
  Patches,
  Pure,
  Reactive,
} from "@shimmer/reactive";
import { OptionalArray } from "../../utils";
import {
  Content,
  DynamicContent,
  StableContentResult,
  StableDynamicContent,
  UpdatableDynamicContent,
} from "../content";
import { createFragment } from "../fragment";
import type { Block } from "./block";

export type ReactiveIterable<T> = Reactive<Iterable<Reactive<T>>>;

export type EachInfo<T = any> = StableEachState<T>;

export interface EachState<T> {
  last: LastEach<T>;
}

export function createEach<T>(
  reactive: Reactive<Iterable<Reactive<T>>>,
  key: (arg: T) => unknown,
  block: Block<[Reactive<T>]>
): Content {
  return initialize({ reactive, key, block });
}

type StableMap<T> = Map<unknown, StableEntry<T>>;

class StableEntry<T> {
  static of<T>(inner: Reactive<T>): StableEntry<T> {
    let cell = Cell.of(inner);
    let reactive = Pure.of(() => cell.now.now);
    return new StableEntry(cell, reactive);
  }

  constructor(readonly cell: Cell<Reactive<T>>, readonly stable: Reactive<T>) {}

  update(reactive: Reactive<T>) {
    this.cell.update(() => reactive);
  }
}

function initialize<T>({
  reactive,
  key: keyOf,
  block,
}: {
  reactive: Reactive<Iterable<Reactive<T>>>;
  key: (arg: T) => unknown;
  block: Block<[Reactive<T>]>;
}): Content {
  let iterableIsStatic = isStaticReactive(reactive);

  // If the iterable is static, we won't need to re-iterate the iterable later, but
  // elements of the iterable might still change. This means we can iterate the
  // values now, but still create a fragment with those iterations. The fragment
  // will handle deeper staticness.
  if (iterableIsStatic) {
    let iterable = reactive.now;
    let content: Content[] = [];

    for (let item of iterable) {
      content.push(block.invoke([item]));
    }

    return createFragment(content);
  } else {
    let info = {
      reactive,
      key: keyOf,
      block,
      stableMap: new Map(),
    };

    return DynamicContent.of("each", info, new UpdatableEach(info));
  }
}

class UpdatableEach<T> extends UpdatableDynamicContent<EachState<T>> {
  readonly shouldClear = false;

  #data: EachInfo<T>;

  constructor(data: EachInfo<T>) {
    super();
    this.#data = data;
  }

  isValid(state: EachState<T>): boolean {
    return state.last.iterable === this.#data.reactive.now;
  }

  poll(state: EachState<T>): void {
    for (let node of state.last.artifacts.dynamic) {
      node.inner.poll();
    }
  }

  render(
    cursor: Cursor,
    dom: SimplestDocument,
    state: EachState<T> | null
  ): { bounds: Bounds; state: EachState<T> } {
    let each = this.#initialize(
      state ? state.last.artifacts : RenderArtifacts.empty(),
      this.#data.reactive.now,
      cursor,
      dom
    );

    return { bounds: each.bounds, state: { last: each } };
  }

  #initialize = (
    artifacts: RenderArtifacts,
    iterable: Iterable<Reactive<T>>,
    cursor: Cursor,
    dom: SimplestDocument
  ) => {
    let nextArtifacts = this.#renderAll(artifacts, iterable, cursor, dom);

    // This polls new dynamic nodes. This is not ideal, but not the
    // end of the world.
    for (let node of nextArtifacts.dynamic) {
      node.inner.poll();
    }

    if (nextArtifacts.isEmpty) {
      throw new Error("unimplemented empty array passed to #each");
    }

    let bounds = nextArtifacts.bounds;

    assert(bounds, `unimplemented empty each`);

    return new LastEach(bounds, iterable, nextArtifacts);
  };

  #renderAll = (
    artifacts: RenderArtifacts,
    iterable: Iterable<Reactive<T>>,
    cursor: Cursor,
    dom: SimplestDocument
  ) => {
    let render = new RenderEach(artifacts);

    for (let item of iterable) {
      this.#render(render, item, dom);
    }

    return render.patch(cursor, dom);
  };

  #render = (render: RenderEach, item: Reactive<T>, dom: SimplestDocument) => {
    let state = new StableEach(this.#data, dom);
    let key = state.keyOf(item.now);

    let stableCell = state.upsertEntry(key, item);

    render.add(key, () => state.render(stableCell.stable));
  };
}

class StableEach<T> {
  #options: StableEachState<T>;
  #dom: SimplestDocument;

  constructor(options: StableEachState<T>, dom: SimplestDocument) {
    this.#options = options;
    this.#dom = dom;
  }

  get dom(): SimplestDocument {
    return this.#dom;
  }

  get iterable(): Iterable<Reactive<T>> {
    return this.#options.reactive.now;
  }

  getEntry(key: unknown): StableEntry<T> | null {
    return this.#options.stableMap.get(key) || null;
  }

  upsertEntry(key: unknown, reactive: Reactive<T>): StableEntry<T> {
    let entry = this.#options.stableMap.get(key);

    if (entry) {
      entry.update(reactive);
    } else {
      entry = StableEntry.of(reactive);
      this.#options.stableMap.set(key, entry);
    }

    return entry;
  }

  keyOf(value: T): unknown {
    return this.#options.key(value);
  }

  render(reactive: Reactive<T>): Content {
    return this.#options.block.invoke([reactive]);
  }

  upsert(reactive: Reactive<T>): StableEntry<T> {
    let key = this.keyOf(reactive.now);

    return this.upsertEntry(key, reactive);
  }
}

class LastEach<T> {
  constructor(
    readonly bounds: Bounds,
    readonly iterable: Iterable<Reactive<T>>,
    readonly artifacts: RenderArtifacts
  ) {}
}

interface StableEachState<T> {
  reactive: ReactiveIterable<T>;
  key: (value: T) => unknown;
  block: Block<[Reactive<T>]>;
  stableMap: StableMap<T>;
}

/**
 * RenderArtifacts keep track of the aspects of the previous render that are unstable (i.e. their
 * identity changes across renders).
 */
class RenderArtifacts {
  static of(nodes: readonly KeyedNode<StableContentResult>[]): RenderArtifacts {
    let map: Map<unknown, KeyedNode<StableContentResult>> = new Map();

    for (let node of nodes) {
      map.set(node.key, node);
    }

    return new RenderArtifacts(map, nodes);
  }

  static empty(): RenderArtifacts {
    return new RenderArtifacts(new Map(), []);
  }

  #map: Map<unknown, KeyedNode<StableContentResult>>;
  #nodes: readonly KeyedNode<StableContentResult>[];

  constructor(
    map: Map<unknown, KeyedNode<StableContentResult>>,
    nodes: readonly KeyedNode<StableContentResult>[]
  ) {
    this.#map = map;
    this.#nodes = nodes;
  }

  get bounds(): Bounds | null {
    let array = OptionalArray.of(this.#nodes);

    if (array.isPresent()) {
      let first = array.first();
      let last = array.last();

      return Bounds.spanning(first.inner.bounds, last.inner.bounds);
    } else {
      return null;
    }
  }

  get isStatic(): boolean {
    return this.dynamic.length === 0;
  }

  get isEmpty(): boolean {
    return this.#nodes.length === 0;
  }

  get(key: unknown): KeyedNode<StableContentResult> | null {
    return this.#map.get(key) || null;
  }

  get nodes(): readonly KeyedNode<StableContentResult>[] {
    return this.#nodes;
  }

  get dynamic(): readonly KeyedNode<StableDynamicContent>[] {
    return this.#nodes.filter(
      (node): node is KeyedNode<StableDynamicContent> =>
        node.inner instanceof StableDynamicContent
    );
  }
}

class RenderEach {
  #prev: RenderArtifacts;

  #next: {
    map: Map<unknown, KeyedNode<Content | StableContentResult>>;
    nodes: KeyedNode<Content | StableContentResult>[];
  };

  constructor(prev: RenderArtifacts) {
    this.#prev = prev;
    this.#next = { map: new Map(), nodes: [] };
  }

  add(key: unknown, block: () => Content): void {
    let content = this.#prev.get(key);

    if (content) {
      this.#next.map.set(key, content);
      this.#next.nodes.push(content);
    } else {
      let rendered = block();
      let node = new KeyedNode(key, rendered);
      this.#next.map.set(key, node);

      this.#next.nodes.push(node);
    }
  }

  patch(cursor: Cursor, dom: SimplestDocument): RenderArtifacts {
    let nextNodes = [...this.#prev.nodes];

    this.#diff().applyPatch(nextNodes, {
      remove: (content, from) => {
        trace("removing", content);
        nextNodes.splice(from, 1);
        content.bounds.clear();
      },
      insert: (content, before) => {
        trace("inserting", content);

        let next = nextNodes[before];
        let nextCursor = next ? next.inner.bounds.cursorBefore : cursor;

        nextNodes.splice(
          before,
          0,
          new KeyedNode(content.key, content.inner.render(nextCursor, dom))
        );
      },
      move: (node, from, to) => {
        trace("moving", node);

        let next = unwrap(nextNodes[to]);
        let cursor = next.inner.bounds.cursorBefore;

        let [content] = nextNodes.splice(from, 1);
        unwrap(content).inner.bounds.move(cursor);
        nextNodes.splice(to, 0, unwrap(content));
      },
    });

    return RenderArtifacts.of(nextNodes);
  }

  #diff = (): Patches<Content, StableContentResult> => {
    return diffArray<Content, StableContentResult>(
      this.#prev.nodes,
      this.#next.nodes
    );
  };
}

const TRACE = false;

function trace(...args: unknown[]): void {
  if (TRACE) {
    console.log(...args);
  }
}
