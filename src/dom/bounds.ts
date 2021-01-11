import { userError } from "../assertions";
import { isObject } from "../utils/predicates";
import { Cursor } from "./cursor";
import type { SimplestNode, SimplestParentNode } from "./simplest";

export class Bounds {
  static is(value: unknown): value is Bounds {
    return isObject(value) && value instanceof Bounds;
  }

  static of(firstNode: SimplestNode, lastNode: SimplestNode): Bounds {
    return new Bounds(firstNode, lastNode);
  }

  static single(node: SimplestNode): Bounds {
    return new Bounds(node, node);
  }

  readonly isStatic = true;

  constructor(
    readonly firstNode: SimplestNode,
    readonly lastNode: SimplestNode
  ) {}

  get bounds(): Bounds {
    return this;
  }

  clear(): Cursor {
    let { firstNode: start, lastNode: end } = this;

    if (start === end) {
      return clearNode(start);
    }

    let parent = start.parentNode! as SimplestParentNode;
    let next = end.nextSibling;

    let last: SimplestNode | null = end;

    while (last) {
      if (last === start) {
        parent.removeChild(last);
        break;
      }

      let prev: SimplestNode | null = last.previousSibling;
      parent.removeChild(last);
      last = prev;
    }

    return new Cursor(parent, next);
  }
}

function clearNode(node: SimplestNode): Cursor {
  let parent = node.parentNode;

  userError(
    parent,
    `DOM#clearNode must be called with an element that has a parent (parentNode was null)`
  );

  let next = node.nextSibling;

  parent.removeChild(node);

  return new Cursor(parent, next);
}
