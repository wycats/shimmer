import { Output } from "../dom/output";
import { DomNode } from "../index";
import { SomeReactive } from "../reactive/reactive";
import { Revision } from "../reactive/revision";
import { Update } from "./input-validator";

export class OutputValidator<In extends SomeReactive, N extends DomNode> {
  static initialize<In extends SomeReactive, N extends DomNode>(
    output: Output<In, N>,
    now: Revision
  ): () => { validator: OutputValidator<In, N>; node: N } {
    return () => {
      let node = output.render(null);

      let validator = new OutputValidator(output, now, node);

      return { validator, node };
    };
  }

  #output: Output<In, N>;
  #lastChecked: Revision;
  #lastNode: N;

  constructor(output: Output<In, N>, lastChecked: Revision, lastNode: N) {
    this.#output = output;
    this.#lastChecked = lastChecked;
    this.#lastNode = lastNode;
  }

  poll(now: Revision): Update<N> {
    if (this.#output.isFresh(this.#lastChecked)) {
      return Update.fresh(this.#lastNode);
    } else {
      this.#lastChecked = now;
      this.#lastNode = this.#output.render(this.#lastNode);
      return Update.stale(this.#lastNode);
    }
  }
}
