import { Bounds } from "@shimmer/dom";
import { build, Reactive } from "@shimmer/reactive";
import { OptionalArray, PresentArray } from "../utils";
import { createComment } from "./comment";
import {
  Content,
  ContentContext,
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
        return StaticContent.of("fragment", { children: list }, (ctx) => {
          return initializeFragment(list as PresentArray<Content>, ctx).bounds;
        }) as any;
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
    ctx: ContentContext,
    state: FragmentState | null
  ): { bounds: Bounds; state: FragmentState } {
    if (state) {
      this.poll(state);
      return { bounds: state.bounds, state };
    }

    let { bounds, dynamic, nodes } = initializeFragment(this.#list, ctx);

    return { bounds, state: { nodes, bounds, dynamic } };
  }
}

export function initializeFragment(
  content: PresentArray<Content>,
  ctx: ContentContext
): {
  bounds: Bounds;
} & FragmentState {
  let [first, rest] = content.split();

  let dynamic: StableDynamicContent[] = [];
  let nodes: StableContentResult[] = [];

  let head = first.render(ctx);
  let tail = head;

  if (head instanceof StableDynamicContent) {
    dynamic.push(head);
  }

  nodes.push(head);

  for (let item of rest) {
    tail = item.render(ctx);

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
