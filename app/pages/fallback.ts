import { App, Cursor, Doc, fragment, text } from "../../src/index";

export class Main {
  static render(cursor: Cursor): App {
    return new Main(Doc.of(document)).render(cursor);
  }

  #doc: Doc;

  constructor(doc: Doc) {
    this.#doc = doc;
  }

  render(cursor: Cursor): App {
    let renderable = this.#doc.render(hello, cursor);
    // GLIMMER.addRenderable(renderable);

    return renderable;
  }
}

const hello = fragment(text("hello"));
