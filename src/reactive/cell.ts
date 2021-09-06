import { Reactive } from "./reactive";
import { Ordering, Revision } from "./revision";
import { Timeline } from "./timeline";

export class Cell<T> implements Reactive<T> {
  #inner: T;
  #current: Revision;
  #timeline: Timeline;

  constructor(
    inner: T,
    timeline: Timeline,
    current: Revision = timeline.bump()
  ) {
    this.#inner = inner;
    this.#timeline = timeline;
    this.#current = current;
  }

  readonly isStatic = false;

  get current(): T {
    return this.#inner;
  }

  isFresh(lastChecked: Revision): boolean {
    switch (lastChecked.compare(this.#current)) {
      case Ordering.Same:
      case Ordering.Newer:
        return true;
      case Ordering.Older:
        return false;
    }
  }

  update(value: T): void {
    this.#inner = value;
    this.#current = this.#timeline.bump();
  }
}
