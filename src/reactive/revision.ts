import { INSPECT_SYMBOL } from "../utils";
import { Timeline } from "./timeline";

export enum Ordering {
  Older = "Older",
  Newer = "Newer",
  Same = "Same",
}

export class Revision {
  #revision: number;
  #timeline: Timeline;

  constructor(revision: number, timeline: Timeline) {
    this.#revision = revision;
    this.#timeline = timeline;
  }

  next(): Revision {
    return new Revision(this.#revision + 1, this.#timeline);
  }

  [INSPECT_SYMBOL](): string {
    return `Revision<${this.#revision}>`;
  }

  /**
   * Compare this revision with another revision.
   *
   * - If the other revision is the same as this revision, returns `same`.
   * - If this revision is newer than the other revision, returns `newer`.
   * - Otherwise, returns `older`.
   *
   * @param other
   * @returns boolean
   */
  compare(other: Revision): Ordering {
    if (other.#revision === this.#revision) {
      return Ordering.Same;
    } else if (other.#revision > this.#revision) {
      return Ordering.Older;
    } else {
      return Ordering.Newer;
    }
  }
}
