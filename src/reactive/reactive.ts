import { InputValidator } from "../validation/input-validator";
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

  constructor(timeline: Timeline) {
    this.#timeline = timeline;
  }

  static<T>(value: T): Static<T> {
    return new Static(value);
  }

  cell<T>(value: T): Cell<T> {
    return new Cell(value, this.#timeline);
  }

  inputValidator<T>(
    reactive: Reactive<T>
  ): () => { validator: InputValidator<T>; value: T } {
    return InputValidator.initialize(reactive, this.#timeline.now);
  }

  get now(): Revision {
    return this.#timeline.now;
  }
}

export type SomeReactive = Reactive<unknown>;
