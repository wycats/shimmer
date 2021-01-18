import { Bounds } from "../dom/bounds";
import type { Cursor } from "../dom/cursor";
import type { SimplestDocument } from "../dom/simplest";
import { build, Reactive } from "../reactive/cell";
import { OptionalArray, PresentArray } from "../utils/type";
import { createComment } from "./comment";
import {
  Content,
  DynamicContent,
  StableContentResult,
  StableDynamicContent,
  StaticContent,
  TemplateContent,
  UpdatableDynamicContent,
} from "./content";

export interface FragmentInfo {
  readonly children: PresentArray<Content>;
}

export type FragmentContent = TemplateContent<"fragment", FragmentInfo>;

export interface FragmentState {
  dynamic: readonly StableDynamicContent[];
  nodes: PresentArray<StableContentResult>;
  bounds: Bounds;
}

export function createFragment(content: readonly Content[]): Content {
  const list = OptionalArray.of(content);

  if (list.isPresent()) {
    return build(() => {
      if (list.every(TemplateContent.isStatic)) {
        return StaticContent.of(
          "fragment",
          { children: list },
          (cursor, dom) => {
            return initializeFragment(
              list as PresentArray<Content>,
              cursor,
              dom
            ).bounds;
          }
        ) as any;
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
      return createComment(Reactive.static(""));
    });
  }
}

class UpdatableFragment extends UpdatableDynamicContent<FragmentState> {
  #list: PresentArray<Content>;

  constructor(list: PresentArray<Content>) {
    super();
    this.#list = list;
  }

  readonly shouldClear = false;

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
    dom: SimplestDocument,
    state: FragmentState | null
  ): { bounds: Bounds; state: FragmentState } {
    if (state) {
      this.poll(state);
      return { bounds: state.bounds, state };
    }

    let { bounds, dynamic, nodes } = initializeFragment(
      this.#list,
      cursor,
      dom
    );

    return { bounds, state: { nodes, bounds, dynamic } };
  }
}

export function initializeFragment(
  content: PresentArray<Content>,
  cursor: Cursor,
  dom: SimplestDocument
): {
  bounds: Bounds;
} & FragmentState {
  let [first, rest] = content.split();

  let dynamic: StableDynamicContent[] = [];
  let nodes: StableContentResult[] = [];

  let head = first.render(cursor, dom);
  let tail = head;

  if (head instanceof StableDynamicContent) {
    dynamic.push(head);
  }

  nodes.push(head);

  for (let item of rest) {
    tail = item.render(cursor, dom);

    if (tail instanceof StableDynamicContent) {
      dynamic.push(tail);
    }

    nodes.push(tail);
  }

  return {
    bounds: Bounds.spanning(head, tail),
    dynamic,
    nodes: PresentArray.of(nodes),
  };
}
