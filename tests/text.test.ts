import { Reactive, Runtime, StrictReactiveFunction } from "../src/index";
import { toHTML } from "./support";

describe("text", () => {
  const RUNTIME = Runtime.simple();

  test("output text node from static", () => {
    let output = RUNTIME.text((v) => v.static("hello world"));
    let text = output.render();

    expect(toHTML(text)).toBe("hello world");
  });

  test("output text node from cell", () => {
    let output = RUNTIME.text((v) => v.cell("hello world"));
    let text = output.render();

    expect(toHTML(text)).toBe("hello world");

    output.input.update("goodbye world");

    output.update(text);

    expect(toHTML(text)).toBe("goodbye world");
  });

  test("output text node from trivial simple computation", () => {
    let identity = StrictReactiveFunction.of(
      (input: Reactive<string>) => input.current
    );

    let cell = RUNTIME.reactive((r) => r.cell("hello world"));

    let output = RUNTIME.text(identity.invoke(cell));
    let text = output.render();

    expect(toHTML(text)).toBe("hello world");

    cell.update("goodbye world");
    output.update(text);

    expect(toHTML(text)).toBe("goodbye world");
  });
});
