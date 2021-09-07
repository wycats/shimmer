import { createDocument } from "simple-dom";
import { Reactive } from "../reactive/reactive";
import { DomDocument, DomText, opaqueToSimplest } from "./simplest";
import { OutputText } from "./text";

export class DOM {
  static simple(): DOM {
    let doc = createDocument();
    return new DOM(doc);
  }

  #document: DomDocument;

  constructor(document: DomDocument) {
    this.#document = document;
  }

  text(text: string): DomText {
    return this.#document.createTextNode(text) as unknown as DomText;
  }

  updateText(node: DomText, value: string): void {
    opaqueToSimplest(node).nodeValue = value;
  }
}

export class OutputNodes {
  #dom: DOM;

  constructor(dom: DOM) {
    this.#dom = dom;
  }

  text<R extends Reactive<string>>(input: R): OutputText<R> {
    return OutputText.initialize(input, this.#dom);
  }
}
