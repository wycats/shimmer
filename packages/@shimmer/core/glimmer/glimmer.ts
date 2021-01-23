import { getValue, TrackedCache } from "@shimmer/reactive";

export interface Render {
  readonly render: TrackedCache<void> | null;
}

class Glimmer {
  #revalidate = new Set<Render>();
  #assertions = new Set<() => void>();
  #promise: Promise<void> | null = null;
  #done: Promise<void> | null = null;

  addRenderable(renderable: Render): void {
    this.#revalidate.add(renderable);
  }

  removeRenderable(renderable: Render): void {
    this.#revalidate.delete(renderable);
  }

  addAssertion(assertion: () => void): void {
    this.#assertions.add(assertion);
  }

  removeAssertion(assertion: () => void): void {
    this.#assertions.delete(assertion);
  }

  async wait(): Promise<void> {
    if (this.#done) {
      // console.log("DONE");
      return this.#done;
    } else {
      // console.log("RESOLVE");
      return Promise.resolve();
    }
  }

  async revalidate() {
    if (this.#promise) {
      return;
    }

    this.#promise = Promise.resolve();
    let fulfill: () => void;
    this.#done = new Promise((f) => (fulfill = f));
    await this.#promise;
    this.#promise = null;
    this.#done = null;

    for (let renderable of this.#revalidate) {
      if (renderable.render) {
        getValue(renderable.render);
      }
    }

    for (let assertion of this.#assertions) {
      assertion();
    }

    fulfill!();
  }
}

export const GLIMMER = new Glimmer();
