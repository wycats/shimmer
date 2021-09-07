import { DOM, OutputNodes } from "./dom/abstract";
import { OutputText } from "./dom/text";
import { Reactive, ReactiveValues } from "./reactive/reactive";
import { Revision } from "./reactive/revision";
import { Update, Validator } from "./validation/validator";

export class Runtime {
  static dom(dom: DOM): Runtime {
    return new Runtime(new OutputNodes(dom), new ReactiveValues());
  }

  static simple(): Runtime {
    return new Runtime(new OutputNodes(DOM.simple()), new ReactiveValues());
  }

  #output: OutputNodes;
  #input: ReactiveValues;

  constructor(output: OutputNodes, input: ReactiveValues) {
    this.#output = output;
    this.#input = input;
  }

  get now(): Revision {
    return this.#input.now;
  }

  validator<T>(
    input: Reactive<T>
  ): () => { validator: Validator<T>; value: T } {
    return this.#input.validator(input);
  }

  poll<T>(validator: Validator<T>): Update<T> {
    return validator.poll(this.#input.now);
  }

  reactive<R extends Reactive<unknown>>(
    input: (values: ReactiveValues) => R
  ): R {
    return input(this.#input);
  }

  text<R extends Reactive<string>>(input: ToInput<R>): OutputText<R> {
    let reactive = this.#toInput(input);
    return this.#output.text(reactive);
  }

  #toInput<R extends Reactive<unknown>>(input: ToInput<R>): R {
    if (typeof input === "function") {
      return input(this.#input);
    } else {
      return input;
    }
  }
}

export type ToInput<R extends Reactive<unknown>> =
  | ((values: ReactiveValues) => R)
  | R;
