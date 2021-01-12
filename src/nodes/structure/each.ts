import { diffArray, Patches, WrapperNode } from "../../array/normalize";
import { assert } from "../../assertions";
import { Bounds, DynamicBounds } from "../../dom/bounds";
import type { SimplestDocument } from "../../dom/simplest";
import { DynamicRenderedContent, Effect, Pure } from "../../glimmer/cache";
import { Cell, IntoReactive, Reactive } from "../../reactive/cell";
import {
  Content,
  ContentResult,
  DynamicContent,
  UpdatableContent,
} from "../content";
import { fragment } from "../fragment";
import type { Block } from "./block";

export type ReactiveIterable<T> = Iterable<IntoReactive<T>>;

export type IntoReactiveIterable<T> = IntoReactive<ReactiveIterable<T>>;

export interface EachInfo {}

export function each<T>(
  value: IntoReactive<Iterable<IntoReactive<T>>>,
  key: (arg: T) => unknown,
  block: Block<T>
): Content {
  let reactive = Reactive.from(value);

  return initialize({ reactive, key, block });
}

type StableMap<T> = Map<
  unknown,
  { cell: Cell<Reactive<T>>; reactive: Reactive<T> }
>;

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
    return DynamicContent.of("each", {}, (cursor, dom) => {
      let iterable = reactive.now;

      let dynamicNodes: WrapperNode<DynamicRenderedContent>[] = [];
      let nodes: WrapperNode<ContentResult>[] = [];
      let stableMap: StableMap<T> = new Map();

      let start: Bounds | null = null;
      let end: Bounds | null = null;

      for (let item of iterable) {
        let reactive = Reactive.from(item);
        let key = keyOf(reactive.now);

        let cell = Cell.of(reactive);
        let stableReactive = Pure.of(() => cell.now.now);
        stableMap.set(key, { cell, reactive: stableReactive });

        let content = block(stableReactive);
        let rendered = content.render(cursor, dom);

        if (start === null) {
          start = rendered.bounds;
        }

        end = rendered.bounds;

        if (Effect.is(rendered)) {
          dynamicNodes.push(new WrapperNode(key, rendered));
        }

        nodes.push(new WrapperNode(key, rendered));
      }

      // let frag = fragment(...nodes.map((n) => n.inner.content));

      assert(start !== null && end !== null, `unimplemented: empty each`);

      let bounds = DynamicBounds.of(start, end);

      return updatableEach<T>({
        reactive,
        bounds,
        key: keyOf,
        block,
        dom,
        stableMap,
        last: {
          iterable,
          dynamicNodes,
          nodes,
        },
      });

      // let bounds = StaticBounds.of(firstNode, lastNode);
    });
  }
}

function updatableEach<T>({
  reactive,
  bounds,
  key: keyOf,
  block,
  dom,
  stableMap,
  last: { iterable, dynamicNodes, nodes },
}: {
  reactive: Reactive<ReactiveIterable<T>>;
  bounds: Bounds;
  key: (value: T) => unknown;
  block: Block<T>;
  dom: SimplestDocument;
  stableMap: StableMap<T>;
  last: {
    iterable: ReactiveIterable<T>;
    dynamicNodes: readonly WrapperNode<DynamicRenderedContent>[];
    nodes: readonly WrapperNode<ContentResult>[];
  };
}): UpdatableContent {
  let content = UpdatableContent.of(
    bounds,
    (): UpdatableContent => {
      let nextIterable = reactive.now;

      if (iterable === nextIterable) {
        for (let node of dynamicNodes) {
          node.inner.poll();
        }

        return content;
      } else {
        let iterable = reactive.now;

        let render = RenderEach.of(nodes);

        for (let item of iterable) {
          let reactive = Reactive.from(item);
          let key = keyOf(reactive.now);

          let stableCell = stableMap.get(key);
          let stableReactive: Reactive<T>;

          if (stableCell) {
            stableCell.cell.update(() => reactive);
            stableReactive = stableCell.reactive;
          } else {
            let cell = Cell.of(reactive);
            stableCell = { cell, reactive: Pure.of(() => cell.now.now) };
            stableReactive = stableCell.reactive;
            stableMap.set(key, stableCell);
          }

          render.add(key, () => block(stableReactive));
        }

        let nextNodes = [...nodes];

        render.diff().applyPatch(nextNodes, {
          remove: (content, from) => {
            nextNodes.splice(from, 1);
            content.bounds.clear();
          },
          insert: (content, before) => {
            let next = nextNodes[before]!;
            nextNodes.splice(
              before,
              0,
              new WrapperNode(
                content.key,
                content.inner.render(next.inner.bounds.cursorBefore, dom)
              )
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

        let nextDynamicNodes = nextNodes.filter(
          (node): node is WrapperNode<DynamicRenderedContent> =>
            Effect.is(node.inner)
        );

        // This polls new dynamic nodes. This is not ideal, but not the
        // end of the world.
        for (let node of nextDynamicNodes) {
          node.inner.poll();
        }

        if (nextNodes.length === 0) {
          throw new Error("unimplemented empty array passed to #each");
        }

        return updatableEach({
          reactive,
          bounds,
          key: keyOf,
          block,
          dom,
          stableMap,
          last: {
            iterable: nextIterable,
            dynamicNodes: nextDynamicNodes,
            nodes: nextNodes,
          },
        });
      }
    }
  );

  return content;
}

class RenderEach {
  static of(nodes: readonly WrapperNode<ContentResult>[]): RenderEach {
    let map: Map<unknown, WrapperNode<ContentResult>> = new Map();

    for (let node of nodes) {
      map.set(node.key, node);
    }

    return new RenderEach({ map, nodes });
  }

  #prev: {
    map: Map<unknown, WrapperNode<ContentResult>>;
    nodes: readonly WrapperNode<ContentResult>[];
  };

  #next: {
    map: Map<unknown, WrapperNode<Content | ContentResult>>;
    nodes: WrapperNode<Content | ContentResult>[];
  };

  constructor(prev: {
    map: Map<unknown, WrapperNode<ContentResult>>;
    nodes: readonly WrapperNode<ContentResult>[];
  }) {
    this.#prev = prev;
    this.#next = { map: new Map(), nodes: [] };
  }

  add(key: unknown, block: () => Content): void {
    let content = this.#prev.map.get(key);

    if (content) {
      this.#next.map.set(key, content);
      this.#next.nodes.push(content);
    } else {
      let rendered = block();
      let node = new WrapperNode(key, rendered);
      this.#next.map.set(key, node);

      this.#next.nodes.push(node);
    }
  }

  diff(): Patches<Content, ContentResult> {
    return diffArray<Content, ContentResult>(
      this.#prev.nodes,
      this.#next.nodes
    );
  }
}
