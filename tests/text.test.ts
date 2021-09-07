import { Reactive, Runtime, StrictReactiveFunction } from "../src/index";
import { html } from "./expectations";
import { SUITE, toHTML, update } from "./support";

describe("text", () => {
  const RUNTIME = Runtime.simple();

  test("output text node from static", () => {
    let output = RUNTIME.text((v) => v.static("hello world"));
    let text = output.render();

    expect(toHTML(text)).toBe("hello world");
  });

  test("output text node from cell", () => {
    let cell = RUNTIME.reactive((r) => r.cell("hello world"));

    SUITE.expect((text) => expect(toHTML(text)).toBe("hello world"))
      .steps([
        {
          update: () => cell.update("goodbye world"),
          andExpect: html("goodbye world"),
        },
      ])
      .render(RUNTIME.text(cell));
  });

  test("output text node from trivial simple computation", () => {
    let identity = StrictReactiveFunction.of(
      (input: Reactive<string>) => input.current
    );

    let cell = RUNTIME.reactive((r) => r.cell("hello world"));
    let input = identity.invoke(cell);

    SUITE.expect(html("hello world"))
      .steps([
        update(() => cell.update("goodbye world")).andExpect(
          html("goodbye world")
        ),
      ])
      .render(RUNTIME.text(input));
  });

  test("output text node for more involved computation", () => {
    let concat = StrictReactiveFunction.of(
      (left: Reactive<string>, right: Reactive<string>) =>
        `${left.current} ${right.current}`
    );

    let left = RUNTIME.reactive((r) => r.cell("hello"));
    let right = RUNTIME.reactive((r) => r.cell("world"));

    let input = concat.invoke(left, right);

    SUITE.expect(html("hello world"))
      .steps([
        update(() => left.update("goodbye")).andExpect(html("goodbye world")),
        update(() => right.update("cruel world")).andExpect(
          html("goodbye cruel world")
        ),
      ])
      .render(RUNTIME.text(input));
  });
});
