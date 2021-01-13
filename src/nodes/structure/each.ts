import { diffArray, KeyedNode, Patches } from "../../array/normalize";
import { assert } from "../../assertions";
import { Bounds, DynamicBounds } from "../../dom/bounds";
import type { Cursor } from "../../dom/cursor";
import type { SimplestDocument } from "../../dom/simplest";
import { Effect, Pure } from "../../glimmer/cache";
import { Cell, IntoReactive, Reactive } from "../../reactive/cell";
import { OptionalArray } from "../../utils/type";
import {
  Content,
  DynamicContent,
  StableContentResult,
  StableDynamicContent,
  UpdatableDynamicContent,
} from "../content";
import { fragment } from "../fragment";
import type { Block } from "./block";

export type ReactiveIterable<T> = Iterable<IntoReactive<T>>;

export type IntoReactiveIterable<T> = IntoReactive<ReactiveIterable<T>>;

export type EachInfo<T = any> = StableEachState<T>;

export interface EachState<T> {
  last: LastEach<T>;
}

export function each<T>(
  value: IntoReactive<Iterable<IntoReactive<T>>>,
  key: (arg: T) => unknown,
  block: Block<T>
): Content {
  let reactive = Reactive.from(value);

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
  reactive: Reactive<ReactiveIterable<T>>;
  key: (arg: T) => unknown;
  block: Block<T>;
}): Content {
  let iterableIsStatic = Reactive.isStatic(reactive);

  // If the iterable is static, we won't need to re-iterate the iterable later, but
  // elements of the iterable might still change. This means we can iterate the
  // values now, but still create a fragment with those iterations. The fragment
  // will handle deeper staticness.
  if (iterableIsStatic) {
    let iterable = reactive.now;
    let content: Content[] = [];

    for (let item of iterable) {
      content.push(block(Reactive.from(item)));
    }

    return fragment(...content);
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
// (cursor, dom) => {
//   let stable = new StableEach({
//     reactive,
//     key: keyOf,
//     block,
//     dom,
//     stableMap: new Map(),
//   });

//   let render = new InitialRenderEach(stable);

//   let iterable = reactive.now;

//   // let start: Bounds | null = null;
//   // let end: Bounds | null = null;

//   for (let item of iterable) {
//     let reactive = Reactive.from(item);
//     let key = stable.keyOf(reactive.now);

//     let entry = RenderableEach.upsert(render, reactive);

//     let content = block(entry.stable);
//     let rendered = content.render(cursor, dom);

//     render.add(key, rendered);
//   }

//   let { artifacts, bounds } = render.done();

//   return updatableEach<T>({
//     stable,
//     last: new LastEach(bounds, iterable, artifacts),
//   });
// }
class UpdatableEach<T> extends UpdatableDynamicContent<EachState<T>> {
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
    dom: SimplestDocument
  ): { bounds: Bounds; state: EachState<T> } {
    let each = this.#initialize(
      RenderArtifacts.empty(),
      this.#data.reactive.now,
      cursor,
      dom
    );

    return { bounds: each.bounds, state: { last: each } };
  }

  #initialize = (
    artifacts: RenderArtifacts,
    iterable: ReactiveIterable<T>,
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
    iterable: ReactiveIterable<T>,
    cursor: Cursor,
    dom: SimplestDocument
  ) => {
    let render = new RenderEach(artifacts);

    for (let item of iterable) {
      this.#render(render, item, dom);
    }

    return render.patch(cursor, dom);
  };

  #render = (
    render: RenderEach,
    item: IntoReactive<T>,
    dom: SimplestDocument
  ) => {
    let reactive = Reactive.from(item);
    let state = new StableEach(this.#data, dom);
    let key = state.keyOf(reactive.now);

    let stableCell = state.upsertEntry(key, reactive);

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

  get iterable(): ReactiveIterable<T> {
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
    return this.#options.block(reactive);
  }

  upsert(reactive: Reactive<T>): StableEntry<T> {
    let key = this.keyOf(reactive.now);

    return this.upsertEntry(key, reactive);
  }
}

class LastEach<T> {
  constructor(
    readonly bounds: Bounds,
    readonly iterable: ReactiveIterable<T>,
    readonly artifacts: RenderArtifacts
  ) {}
}

interface StableEachState<T> {
  reactive: Reactive<ReactiveIterable<T>>;
  key: (value: T) => unknown;
  block: Block<T>;
  stableMap: StableMap<T>;
}

// interface UpdatableEachOptions<T> {
//   stable: StableEach<T>;
//   last: LastEach<T>;
// }

// class RenderableEach<T> {
//   #stable: StableEach<T>;

//   constructor(stable: StableEach<T>) {
//     this.#stable = stable;
//   }

//   get dom(): SimplestDocument {
//     return this.#stable.dom;
//   }
// }

// class InitialRenderEach<T> extends RenderableEach<T> {
//   readonly #dynamicNodes: KeyedNode<DynamicRenderedContent>[] = [];
//   readonly #nodes: KeyedNode<ContentResult>[] = [];
//   #start: Bounds | null = null;
//   #end: Bounds | null = null;

//   constructor(stable: StableEach<T>) {
//     super(stable);
//   }

//   done(): { artifacts: RenderArtifacts; bounds: Bounds } {
//     assert(
//       this.#start !== null && this.#end !== null,
//       `unimplemented empty each`
//     );

//     return {
//       artifacts: RenderArtifacts.of(this.#nodes),
//       bounds: Bounds.spanning(this.#start, this.#end),
//     };
//   }

//   add(key: unknown, rendered: ContentResult) {
//     if (Effect.is(rendered)) {
//       this.#dynamicNodes.push(new KeyedNode(key, rendered));
//     }

//     if (this.#start === null) {
//       this.#start = rendered.bounds;
//     }

//     this.#end = rendered.bounds;

//     this.#nodes.push(new KeyedNode(key, rendered));
//   }
// }

// class DynamicEach<T> extends RenderableEach<T> {
//   static update<T>(options: UpdatableEachOptions<T>) {
//     return new DynamicEach(options).#update();
//   }

//   // readonly #stable: StableEach<T>;
//   readonly #last: LastEach<T>;

//   constructor({ stable, last }: UpdatableEachOptions<T>) {
//     super(stable);
//     // this.#stable = stable;
//     this.#last = last;
//   }

//   get bounds(): Bounds {
//     return this.#last.bounds;
//   }

//   #dynamicNodes = () => this.#last.artifacts.dynamic;

//   #poll = () => {
//     for (let node of this.#dynamicNodes()) {
//       node.inner.poll();
//     }
//   };

//   #render = (render: RenderEach, item: IntoReactive<T>) => {
//     let reactive = Reactive.from(item);
//     let key = RenderableEach.keyOf(this, reactive.now);

//     let stableCell = RenderableEach.upsertEntry(this, key, reactive);

//     render.add(key, () => RenderableEach.render(this, stableCell.stable));
//   };

//   #renderAll = (iterable: ReactiveIterable<T>, cursor: Cursor) => {
//     let render = new RenderEach(this.#last.artifacts);

//     for (let item of iterable) {
//       this.#render(render, item);
//     }

//     return render.patch(cursor, this.dom);
//   };

//   #initialize = (iterable: ReactiveIterable<T>) => {
//     let nextArtifacts = this.#renderAll(iterable);

//     // This polls new dynamic nodes. This is not ideal, but not the
//     // end of the world.
//     for (let node of nextArtifacts.dynamic) {
//       node.inner.poll();
//     }

//     if (nextArtifacts.isEmpty) {
//       throw new Error("unimplemented empty array passed to #each");
//     }

//     let bounds = nextArtifacts.bounds;

//     assert(bounds, `unimplemented empty each`);

//     return RenderableEach.updatable(this, {
//       iterable,
//       artifacts: nextArtifacts,
//       bounds,
//     });
//   };

//   #update = () => {
//     let content = UpdatableContent.of(
//       this.bounds,
//       (): UpdatableContent => {
//         let nextIterable = RenderableEach.iterable(this);

//         if (this.#last.iterable === nextIterable) {
//           this.#poll();
//           return content;
//         } else {
//           return this.#initialize(nextIterable);
//         }
//       }
//     );

//     return content;
//   };
// }

// function updatableEach<T>(options: UpdatableEachOptions<T>): UpdatableContent {
//   return DynamicEach.update(options);
// }

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

      return DynamicBounds.of(first.inner.bounds, last.inner.bounds);
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
    return this.#nodes.filter((node): node is KeyedNode<StableDynamicContent> =>
      Effect.is(node.inner)
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
        nextNodes.splice(from, 1);
        content.bounds.clear();
      },
      insert: (content, before) => {
        let next = nextNodes[before];
        let nextCursor = next ? next.inner.bounds.cursorBefore : cursor;

        nextNodes.splice(
          before,
          0,
          new KeyedNode(content.key, content.inner.render(nextCursor, dom))
        );
      },
      move: (_node, from, to) => {
        let next = nextNodes[to]!;
        let cursor = next.inner.bounds.cursorBefore;

        let [content] = nextNodes.splice(from, 1);
        content!.inner.bounds.move(cursor);
        nextNodes.splice(to, 0, content!);
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
