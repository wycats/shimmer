import { Bounds } from "../dom/bounds";
import { Cursor } from "../dom/cursor";
import { SimplestDocument } from "../dom/simplest";
import { Effect } from "../glimmer/cache";
import { PresentArray } from "../utils/type";
import {
  Content,
  DynamicContent,
  renderBounds,
  RenderedContent,
  StaticContent,
  TemplateContent,
  UpdatableContent,
} from "./content";

export interface FragmentInfo {
  readonly children: PresentArray<Content>;
}

export function fragment(
  first: Content,
  ...rest: readonly Content[]
): TemplateContent<"fragment", FragmentInfo> {
  if (first.isStatic && rest.every((c) => c.isStatic)) {
    return StaticContent.of(
      "fragment",
      { children: [first, ...rest] },
      (cursor, dom) => {
        return initialize([first, ...rest], cursor, dom).bounds;
      }
    );
  } else {
    return DynamicContent.of(
      "fragment",
      { children: [first, ...rest] },
      (cursor, dom) => {
        let { bounds, dynamic } = initialize([first, ...rest], cursor, dom);

        return UpdatableContent.of(bounds, () => {
          for (let item of dynamic) {
            item.poll();
          }
        });
      }
    );
  }
}

function initialize(
  content: PresentArray<Content>,
  cursor: Cursor,
  dom: SimplestDocument
): { bounds: Bounds; dynamic: readonly Effect<RenderedContent>[] } {
  let [first, ...rest] = content;

  let dynamic: Effect<RenderedContent>[] = [];

  let head = first.render(cursor, dom);
  let tail = head;

  if (!Bounds.is(head)) {
    dynamic.push(head);
  }

  for (let item of rest) {
    tail = item.render(cursor, dom);

    if (!Bounds.is(tail)) {
      dynamic.push(tail);
    }
  }

  return {
    bounds: Bounds.of(
      renderBounds(head).firstNode,
      renderBounds(tail).lastNode
    ),
    dynamic,
  };
}
