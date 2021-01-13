import { App, Cursor, Doc, fragment, GLIMMER, text } from "../../src/index";

export class Main {
  static render(): App {
    return new Main(Doc.of(document)).render();
  }

  #doc: Doc;

  constructor(doc: Doc) {
    this.#doc = doc;
  }

  render(): App {
    let renderable = this.#doc.render(hello, Cursor.appending(document.body));
    GLIMMER.addRenderable(renderable);

    return renderable;
  }
}

const hello = fragment(text("hello"));
