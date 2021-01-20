import type {
  SimplestChildNode,
  SimplestElement,
  SimplestParentNode,
  SimplestTokenList,
} from "./simplest";
import { TokenList } from "./token-list";

export interface TokenListAttrs {
  [key: string]: ((element: SimplestElement) => boolean) | undefined;
}

export const TOKEN_LIST_ATTRS: TokenListAttrs = {
  role: () => true,
  class: () => true,
  "aria-controls": () => true,
  "aria-describedby": () => true,
  "aria-flow-to": () => true,
  "aria-labelled-by": () => true,
  "aria-owns": () => true,
  "aria-relevant": () => true,
  "aria-sort": () => true,
  rel: (el: SimplestElement) =>
    el.localName === "link" ||
    el.localName === "anchor" ||
    el.localName === "area",
  sandbox: (el: SimplestElement) => el.localName === "iframe",
  for: (el: SimplestElement) => el.localName === "output",
};

export function isTokenListAttr(
  attr: string | keyof TokenListAttrs
): attr is keyof TokenListAttrs {
  return attr in TOKEN_LIST_ATTRS;
}

export class ElementCursor implements SimplestElement {
  static of(element: SimplestElement): ElementCursor {
    return new ElementCursor(element);
  }

  #element: SimplestElement;

  constructor(element: SimplestElement) {
    this.#element = element;
  }

  isTokenList(attr: string): boolean {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return isTokenListAttr(attr) && TOKEN_LIST_ATTRS[attr]!(this.#element);
  }

  getTokenList(attr: keyof TokenListAttrs & string): SimplestTokenList {
    return new TokenList(this.#element, attr, null);
  }

  asElement<E extends SimplestElement>(): E {
    return this.#element as E;
  }

  get classList(): SimplestTokenList {
    return this.getTokenList("class");
  }

  get localName(): string {
    return this.#element.localName;
  }

  get namespaceURI(): string | null {
    return this.#element.namespaceURI;
  }

  getAttributeNS(namespace: string | null, localName: string): string | null {
    return this.#element.getAttributeNS(namespace, localName);
  }

  setAttributeNS(
    namespace: string | null,
    localName: string,
    value: string
  ): void {
    this.#element.setAttributeNS(namespace, localName, value);
  }

  removeAttributeNS(namespace: string | null, localName: string): void {
    this.#element.removeAttributeNS(namespace, localName);
  }

  get nodeType(): number {
    return this.#element.nodeType;
  }

  get firstChild(): SimplestChildNode | null {
    return this.#element.firstChild;
  }

  get lastChild(): SimplestChildNode | null {
    return this.#element.lastChild;
  }

  get nextSibling(): SimplestChildNode | null {
    return this.#element.nextSibling;
  }

  get previousSibling(): SimplestChildNode | null {
    return this.#element.previousSibling;
  }

  get parentNode(): SimplestParentNode | null {
    return this.#element.parentNode;
  }

  insertBefore(
    newChild: SimplestChildNode,
    nextSibling: SimplestChildNode | null
  ): SimplestChildNode {
    return this.#element.insertBefore(newChild, nextSibling);
  }

  removeChild(child: SimplestChildNode): SimplestChildNode {
    return this.#element.removeChild(child);
  }
}
