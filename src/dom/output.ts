import { SomeReactive } from "../reactive/reactive";
import { DomNode } from "./simplest";

export interface Output<In extends SomeReactive, N extends DomNode> {
  readonly input: In;

  render(): N;
  update(node: N): void;
}
