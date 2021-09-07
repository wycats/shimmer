import { createDocument } from "simple-dom";
import { Reactive, SomeReactive } from "../reactive/reactive";
import { Timeline } from "../reactive/timeline";
import { OutputValidator } from "../validation/output-validator";
import { Output } from "./output";
import { DomDocument, DomNode, DomText, opaqueToSimplest } from "./simplest";
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
  #timeline: Timeline;

  constructor(dom: DOM, timeline: Timeline) {
    this.#dom = dom;
    this.#timeline = timeline;
  }

  text<R extends Reactive<string>>(input: R): OutputText<R> {
    return OutputText.initialize(input, this.#dom);
  }

  outputValidator<In extends SomeReactive, N extends DomNode>(
    output: Output<In, N>
  ): () => { validator: OutputValidator<In, N>; node: N } {
    return OutputValidator.initialize(output, this.#timeline.now);
  }
}
