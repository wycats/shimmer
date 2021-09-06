import { DOM } from "./abstract";
import { Reactive } from "../reactive/reactive";
import { Output } from "./output";
import { DomText } from "./simplest";

export class OutputText<R extends Reactive<string>>
  implements Output<R, DomText>
{
  static initialize<R extends Reactive<string>>(
    input: R,
    dom: DOM
  ): OutputText<R> {
    let current = input.current;
    return new OutputText(input, current, dom);
  }

  #input: R;
  #current: string;
  #dom: DOM;

  constructor(input: R, current: string, dom: DOM) {
    this.#input = input;
    this.#current = current;
    this.#dom = dom;
  }

  get input(): R {
    return this.#input;
  }

  render(): DomText {
    let val = this.#input.current;
    return this.#dom.text(val);
  }

  update(node: DomText): void {
    let current = this.#input.current;

    if (this.#current !== current) {
      node.nodeValue = current;
    }
  }
}
