import { Revision } from "./revision";

export class Timeline {
  #current: number;

  constructor(current = 1) {
    this.#current = current;
  }

  get now(): Revision {
    return new Revision(this.#current, this);
  }

  bump(): Revision {
    let next = (this.#current = this.#current + 1);
    return new Revision(next, this);
  }
}
