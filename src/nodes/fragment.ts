import { Bounds, DynamicBounds } from "../dom/bounds";
import type { Cursor } from "../dom/cursor";
import type { SimplestDocument } from "../dom/simplest";
import { build, Reactive } from "../reactive/cell";
import { OptionalArray, PresentArray } from "../utils/type";
import { comment } from "./comment";
import {
  Content,
  DynamicContent,
  StableContentResult,
  StableDynamicContent,
  StaticContent,
  UpdatableDynamicContent,
} from "./content";

export interface FragmentInfo {
  readonly children: PresentArray<Content>;
}

export interface FragmentState {
  dynamic: readonly StableDynamicContent[];
  nodes: PresentArray<StableContentResult>;
}

export function fragment(...content: readonly Content[]): Content {
  const list = OptionalArray.of(content);

  if (list.isPresent()) {
    return build(() => {
      if (list.every((item): item is Content => item.isStatic)) {
        return StaticContent.of(
          "fragment",
          { children: list },
          (cursor, dom) => {
            return initializeFragment(list, cursor, dom).bounds;
          }
        );
      } else {
        return DynamicContent.of(
          "fragment",
          { children: list },
          new UpdatableFragment(list)
        );
      }
    });
  } else {
    return build(() => {
      return comment(Reactive.static(""));
    });
  }
}

class UpdatableFragment extends UpdatableDynamicContent<FragmentState> {
  #list: PresentArray<Content>;

  constructor(list: PresentArray<Content>) {
    super();
    this.#list = list;
  }

  isValid(): boolean {
    return true;
  }

  poll(state: FragmentState): void {
    for (let node of state.dynamic) {
      node.poll();
    }
  }

  render(
    cursor: Cursor,
    dom: SimplestDocument
  ): { bounds: Bounds; state: FragmentState } {
    let { bounds, dynamic, nodes } = initializeFragment(
      this.#list,
      cursor,
      dom
    );

    return { bounds, state: { nodes, dynamic } };
  }
}

export function initializeFragment(
  content: PresentArray<Content>,
  cursor: Cursor,
  dom: SimplestDocument
): {
  bounds: Bounds;
} & FragmentState {
  // let [first, ...rest] = content;
  let [first, rest] = content.split();

  let dynamic: StableDynamicContent[] = [];
  let nodes: StableContentResult[] = [];

  let head = first.render(cursor, dom);
  let tail = head;

  if (!Bounds.is(head)) {
    dynamic.push(head);
  }

  nodes.push(head);

  for (let item of rest) {
    tail = item.render(cursor, dom);

    if (!Bounds.is(tail)) {
      dynamic.push(tail);
    }

    nodes.push(tail);
  }

  return {
    bounds: DynamicBounds.of(head.bounds, tail.bounds),
    dynamic,
    nodes: PresentArray.of(nodes),
  };
}
