import type { SimplestElement, SimplestTokenList } from "./simplest";

export const XLINK = "http://www.w3.org/1999/xlink";
export const XML = "http://www.w3.org/XML/1998/namespace";
export const XMLNS = "http://www.w3.org/2000/xmlns/";

export type AttrNamespace = typeof XLINK | typeof XML | typeof XMLNS;

export class TokenList implements SimplestTokenList {
  #element: SimplestElement;
  #attr: string;
  #ns: AttrNamespace | null;
  #tokens: string[];

  constructor(
    element: SimplestElement,
    attr: string,
    ns: AttrNamespace | null
  ) {
    this.#element = element;
    this.#attr = attr;
    this.#ns = ns;
    this.#tokens = tokens(element.getAttributeNS(ns, attr));
  }

  get length(): number {
    return this.#tokens.length;
  }

  #persist = (): void => {
    this.#element.setAttributeNS(this.#ns, this.#attr, this.#tokens.join(" "));
  };

  add(...tokens: string[]): void {
    for (let token of tokens) {
      if (!this.#tokens.includes(token)) {
        this.#tokens.push(token);
      }
    }

    this.#persist();
  }

  remove(...tokens: string[]): void {
    for (let token of tokens) {
      let pos = this.#tokens.indexOf(token);

      if (pos !== -1) {
        this.#tokens.splice(pos, 1);
      }
    }

    this.#persist();
  }

  replace(oldToken: string, newToken: string): boolean {
    let pos = this.#tokens.indexOf(oldToken);

    if (pos === -1) {
      return false;
    }

    this.#tokens.splice(pos, 1, newToken);

    this.#persist();

    return true;
  }

  contains(token: string): boolean {
    return this.#tokens.includes(token);
  }

  item(index: number): string | null {
    return this.#tokens[index] || null;
  }
}

function tokens(value: string | null): string[] {
  if (value === null) {
    return [];
  } else {
    return value.replace(/^\s+|\s+$/g, "").split(/\s+/);
  }
}
