import { Validator } from "../validation/validator";
import { Cell } from "./cell";
import { Revision } from "./revision";
import { Static } from "./static";
import { Timeline } from "./timeline";

export interface Reactive<T> {
  readonly isStatic: boolean;
  readonly current: T;

  isFresh(lastChecked: Revision): boolean;
}

export class ReactiveValues {
  #timeline: Timeline;

  constructor(timeline: Timeline = new Timeline()) {
    this.#timeline = timeline;
  }

  static<T>(value: T): Static<T> {
    return new Static(value);
  }

  cell<T>(value: T): Cell<T> {
    return new Cell(value, this.#timeline);
  }

  validator<T>(
    reactive: Reactive<T>
  ): () => { validator: Validator<T>; value: T } {
    return Validator.initialize(reactive, this.#timeline);
  }

  get now(): Revision {
    return this.#timeline.now;
  }
}

export type SomeReactive = Reactive<unknown>;
