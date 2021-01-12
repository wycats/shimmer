import { userError } from "../assertions";
import { isObject } from "../utils/predicates";
import { Cursor } from "./cursor";
import type { SimplestNode, SimplestParentNode } from "./simplest";

export type Bounds = StaticBounds | DynamicBounds;

export const Bounds = {
  is: (value: unknown): value is Bounds => {
    return AbstractBounds.is(value);
  },
};

export abstract class AbstractBounds {
  static is(value: unknown): value is StaticBounds {
    return isObject(value) && value instanceof AbstractBounds;
  }

  #parent: SimplestParentNode;

  constructor(parent: SimplestParentNode) {
    this.#parent = parent;
  }

  get parent(): SimplestParentNode {
    return this.#parent;
  }

  abstract readonly bounds: Bounds;
  abstract readonly firstNode: SimplestNode;
  abstract readonly lastNode: SimplestNode;

  get cursorBefore(): Cursor {
    return new Cursor(this.parent, this.firstNode);
  }

  get cursorAfter(): Cursor {
    return new Cursor(this.parent, this.lastNode.nextSibling);
  }

  move(this: Bounds, cursor: Cursor): Bounds {
    let { firstNode: start, lastNode: end } = this;

    if (cursor.hasNext(this.lastNode.nextSibling)) {
      return this;
    }

    let current: SimplestNode | null = start;

    while (current) {
      if (current === end) {
        cursor.insert(current);
        break;
      }

      let next: SimplestNode | null = current.nextSibling;
      cursor.insert(current);
      current = next;
    }

    return this;
  }

  clear(): Cursor {
    let { firstNode: start, lastNode: end, parent } = this;

    if (start === end) {
      return clearNode(start);
    }

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

export class DynamicBounds extends AbstractBounds {
  static single(bounds: Bounds): DynamicBounds {
    return new DynamicBounds(bounds, bounds);
  }

  static of(first: Bounds, last: Bounds): DynamicBounds {
    return new DynamicBounds(first, last);
  }

  #first: Bounds;
  #last: Bounds;

  constructor(first: Bounds, last: Bounds) {
    super(first.parent);
    this.#first = first;
    this.#last = last;
  }

  get bounds(): Bounds {
    return this;
  }

  get firstNode(): SimplestNode {
    return this.#first.firstNode;
  }

  get lastNode(): SimplestNode {
    return this.#last.lastNode;
  }
}

export class StaticBounds extends AbstractBounds {
  static of(firstNode: SimplestNode, lastNode: SimplestNode): StaticBounds {
    return new StaticBounds(firstNode, lastNode);
  }

  static single(node: SimplestNode): StaticBounds {
    return new StaticBounds(node, node);
  }

  readonly isStatic = true;

  constructor(
    readonly firstNode: SimplestNode,
    readonly lastNode: SimplestNode
  ) {
    super(firstNode.parentNode!);
  }

  get bounds(): Bounds {
    return this;
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
