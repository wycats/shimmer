import { DomNode } from "../src/index";
import { toHTML } from "./support";

export type SimpleExpectation<T> = (input: T) => void;

export type Expectation<T> = SimpleExpectation<T> | MatcherExpectation<T>;

export interface MatcherExpectation<T> {
  assert(actual: T): void;
}

export class HtmlExpectation implements MatcherExpectation<DomNode> {
  static of(html: string): HtmlExpectation {
    return new HtmlExpectation(html);
  }

  #html: string;

  constructor(html: string) {
    this.#html = html;
  }

  assert(actual: DomNode): void {
    expect(toHTML(actual)).toBe(this.#html);
  }
}

export const html = HtmlExpectation.of;

export function invokeExpectation<T>(
  expectation: Expectation<T>,
  value: T
): void {
  if (typeof expectation === "function") {
    return expectation(value);
  } else {
    return expectation.assert(value);
  }
}
