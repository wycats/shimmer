import { SomeReactive } from "../reactive/reactive";
import { Revision } from "../reactive/revision";
import { DomNode } from "./simplest";

export interface Output<In extends SomeReactive, N extends DomNode> {
  readonly input: In;

  render(prev: N | null): N;
  isFresh(lastChecked: Revision): boolean;
  update(node: N): void;
}
