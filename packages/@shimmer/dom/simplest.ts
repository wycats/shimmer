/**
 * The purpose of this file is to create the minimal interface needed to implement Glimmer's tree
 * builder, without the (very useful) extra type information from SimpleDOM. SimplestDOM is
 * compatible with normal DOM and SimpleDOM.
 */

export interface SimplestDocument {
  readonly body: SimplestElement;

  createElementNS(namespace: string, name: string): SimplestElement;
  createDocumentFragment(): SimplestParentNode;
  createTextNode(data: string): SimplestCharacterData;
  createComment(data: string): SimplestCharacterData;
}

export interface SimplestNode {
  /**
   * What kind of node is this?
   */
  readonly nodeType: number;

  /**
   * A traversal operation.
   *
   * Gets the first child SimplestNode, if one exists.
   */
  readonly firstChild: SimplestChildNode | null;

  /**
   * A traversal operation.
   *
   * Gets the last child SimplestNode, if one exists.
   */
  readonly lastChild: SimplestChildNode | null;

  /**
   * A traversal operation.
   *
   * Gets the next sibling SimplesNode, if one exists.
   */
  readonly nextSibling: SimplestChildNode | null;

  /**
   * A traversal operation.
   *
   * Gets the previous sibling SimplestNode, if one exists.
   */
  readonly previousSibling: SimplestChildNode | null;

  /**
   * A traversal operation.
   *
   * Gets the parent SimplestNode (which must be a SimplestParentNode), if one exists.
   */
  readonly parentNode: SimplestParentNode | null;
}

/**
 * Elements and DocumentFragments are SimplestParentNode
 */
export interface SimplestParentNode extends SimplestNode {
  /**
   * Insert a new child into this node. If `nextSibling` is specified, the new child node is
   * inserted right before that child. Otherwise, it's inserted at the end.
   *
   * This method returns the `newChild`, once it has been inserted.
   *
   * Invariant: if `nextSibling` is not `null`, it must be a child of this node.
   */
  insertBefore(
    newChild: SimplestChildNode,
    nextSibling: SimplestChildNode | null
  ): SimplestChildNode;

  /**
   * Remove an existing child from this node.
   *
   * Invariant: `child` must be a child of this node.
   */
  removeChild(child: SimplestChildNode): SimplestChildNode;
}

export interface SimplestElement extends SimplestParentNode {
  readonly classList: SimplestTokenList;

  /**
   * The part of the element's tag name that does not include its namespace. This is in normalized
   * form (HTML element names are lowercased, SVG names like `foreignObject` are camelcased).
   */
  readonly localName: string;

  /**
   * The namespace part of the element's tag name. If the namespace is HTML, `namespaceURI` is null.
   */
  readonly namespaceURI: string | null;

  /**
   * Get an attribute from this element, possibly within a namespace.
   *
   * The equivalent of `getAttribute` in richer DOM APIs is `getAttributeNS(null, ...)`
   */
  getAttributeNS(namespace: string | null, localName: string): string | null;

  /**
   * Sets an attribute on this element, possibly within a namespace.
   *
   * The equivalent of `setAttribute` in richer DOM APIs is `getAttributeNS(null, ...)`
   */
  setAttributeNS(
    namespace: string | null,
    localName: string,
    value: string
  ): void;

  /**
   * Remove an attribute from this element, possibly within a namespace.
   */
  removeAttributeNS(namespace: string | null, localName: string): void;
}

export interface SimplestTokenList {
  /** SimpleTokenList is an array-like, which means that Array's generic methods work on it */
  readonly length: number;

  /**
   * Add some tokens to the SimplestTokenList.
   *
   * If a token is already in the list, it doesn't change
   * the list. If a token is not present, it is appended to the end of the list.
   */
  add(...tokens: string[]): void;

  /**
   * Remove some tokens from the SimplestTokenList.
   *
   * If a token is already in the list, it's removed.
   * Otherwise, it doesn't change the list.
   */
  remove(...tokens: string[]): void;

  /**
   * Replace an old token with a new token.
   *
   * This is not identical to `remove` + `add`, which would add the new token at the end of the
   * ordered set. The `replace` method inserts the new token in the same location as the old one.
   *
   * From the spec: If the first token doesn't exist, replace() returns false immediately, without
   * adding the new token to the token list.
   */
  replace(oldToken: string, newToken: string): void;

  /**
   *
   *
   * If the token is present in the list, return true. Otherwise, return false.
   */
  contains(token: string): boolean;
  item(index: number): string | null;
}

/**
 * Text and Comment nodes are SimplestCharacterData
 */
export interface SimplestCharacterData extends SimplestNode {
  /** data is a mutable field */
  data: string;
}

export type SimplestChildNode = SimplestNode;
// export type SimplestParentNode = SimplestNode;
