import { HTMLSerializer, voidMap } from "simple-dom";
import { DomNode, opaqueToSimple, Output, SomeReactive } from "../src/index";
import { Expectation, invokeExpectation } from "./expectations";

const SERIALIZER = new HTMLSerializer(voidMap);

export function toHTML(node: DomNode): string {
  let simple = opaqueToSimple(node);
  return SERIALIZER.serialize(simple);
}

export interface Step<N extends DomNode> {
  update: () => void;
  andExpect: Expectation<N>;
}

export class RenderTest1<In extends SomeReactive, N extends DomNode> {
  expect(expectation: Expectation<N>): RenderTest2<In, N> {
    return new RenderTest2(expectation);
  }
}

export class RenderTest2<In extends SomeReactive, N extends DomNode> {
  #expectation: Expectation<N>;

  constructor(expectation: Expectation<N>) {
    this.#expectation = expectation;
  }

  steps(steps: readonly Step<N>[]): RenderTest<In, N> {
    return new RenderTest(this.#expectation, steps);
  }
}

export class RenderTest<In extends SomeReactive, N extends DomNode> {
  #expectation: Expectation<N>;
  #steps: readonly Step<N>[];

  constructor(expectation: Expectation<N>, steps: readonly Step<N>[]) {
    this.#expectation = expectation;
    this.#steps = steps;
  }

  render(output: Output<In, N>): void {
    let node = output.render(null);

    invokeExpectation(this.#expectation, node);

    for (let step of this.#steps) {
      step.update();
      output.update(node);
      invokeExpectation(step.andExpect, node);
    }
  }
}

export const SUITE = new RenderTest1();

export function update<N extends DomNode>(
  update: () => void
): { andExpect: (expectation: Expectation<N>) => Step<N> } {
  return {
    andExpect(expectation: Expectation<N>): Step<N> {
      return {
        update,
        andExpect: expectation,
      };
    },
  };
}
