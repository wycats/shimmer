import { Runtime } from "../src/runtime";
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
});

// @suite()
// export class TextSuite {
//   readonly #runtime = Runtime.simple();

//   @test()
//   "output text node from static"() {
//     let output = this.#runtime.text((v) => v.static("hello world"));
//     let text = output.render();

//     expect.toBeEqual(
//       toHTML(text),
//       "hello world",
//       "static text is inserted into a text node"
//     );
//   }

//   @test()
//   "output text node from cell"() {
//     let output = this.#runtime.text((v) => v.cell("hello world"));
//     let text = output.render();

//     expect.toBeEqual(
//       toHTML(text),
//       "hello world",
//       "cell is inserted into a text node"
//     );
//   }

//   @test()
//   "output text node from cell"() {
//     let output = this.#runtime.text((v) => v.cell("hello world"));
//     let text = output.render();

//     expect.toBeEqual(
//       toHTML(text),
//       "hello world",
//       "cell is inserted into a text node"
//     );
//   }
// }
