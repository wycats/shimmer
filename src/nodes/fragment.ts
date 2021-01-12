import { Bounds, DynamicBounds } from "../dom/bounds";
import type { Cursor } from "../dom/cursor";
import type { SimplestDocument } from "../dom/simplest";
import type { DynamicRenderedContent } from "../glimmer/cache";
import { build, Reactive } from "../reactive/cell";
import { OptionalArray, PresentArray } from "../utils/type";
import { comment } from "./comment";
import {
  Content,
  ContentResult,
  DynamicContent,
  StaticContent,
  UpdatableContent,
} from "./content";

export interface FragmentInfo {
  readonly children: PresentArray<Content>;
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
          (cursor, dom) => {
            let { bounds, dynamic, nodes } = initializeFragment(
              list,
              cursor,
              dom
            );

            return dynamicFragment({ bounds, dynamic, nodes });
          }
        );
      }
    });
  } else {
    return build(() => {
      return comment(Reactive.static(""));
    });
  }
}

function dynamicFragment({
  bounds,
  dynamic,
  nodes,
}: {
  bounds: Bounds;
  dynamic: readonly DynamicRenderedContent[];
  nodes: PresentArray<ContentResult>;
}): UpdatableContent {
  return UpdatableContent.of(bounds, () => {
    for (let item of dynamic) {
      item.poll();
    }

    let first = nodes.first();
    let last = nodes.last();
    return dynamicFragment({
      bounds: DynamicBounds.of(first.bounds, last.bounds),
      dynamic,
      nodes,
    });
  });
}
export function initializeFragment(
  content: PresentArray<Content>,
  cursor: Cursor,
  dom: SimplestDocument
): {
  bounds: Bounds;
  dynamic: readonly DynamicRenderedContent[];
  nodes: PresentArray<ContentResult>;
} {
  // let [first, ...rest] = content;
  let [first, rest] = content.split();

  let dynamic: DynamicRenderedContent[] = [];
  let nodes: ContentResult[] = [];

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
