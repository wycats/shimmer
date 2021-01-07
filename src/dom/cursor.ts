import { SimplestNode, SimplestParentNode } from "./simplest";

export class Cursor {
  static at(parent: SimplestParentNode, next: SimplestNode): Cursor {
    return new Cursor(parent, next);
  }

  static appending(parent: SimplestParentNode): Cursor {
    return new Cursor(parent, null);
  }

  #parent: SimplestParentNode;
  #next: SimplestNode | null;

  constructor(parent: SimplestParentNode, next: SimplestNode | null) {
    this.#parent = parent;
    this.#next = next;
  }

  insert<N extends SimplestNode>(node: N): N {
    this.#parent.insertBefore(node, this.#next);
    return node;
  }
}
