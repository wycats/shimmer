import {
  App,
  component,
  Content,
  Cursor,
  Doc,
  fragment,
  Owner,
  text,
} from "../../src/index";
import { Nav } from "./nav";

export class Main {
  static render(cursor: Cursor, owner: Owner): App {
    return new Main(owner, Doc.of(document)).render(cursor);
  }

  // #owner: Owner;
  #doc: Doc;
  #template: Content;

  constructor(owner: Owner, doc: Doc) {
    // this.#owner = owner;
    this.#doc = doc;
    this.#template = Hello(owner)();
  }

  render(cursor: Cursor): App {
    let renderable = this.#doc.render(this.#template, cursor);
    // GLIMMER.addRenderable(renderable);

    return renderable;
  }
}

const Hello = component((owner: Owner) => () =>
  fragment(Nav(owner)(), text("hello"))
);
