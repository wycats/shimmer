import type { SimplestElement } from "@shimmer/dom";
import { getValue, TrackedCache } from "@shimmer/reactive";

export interface Renderable {
  readonly render: TrackedCache<void> | null;
}

type State =
  | "INITIAL"
  | "RENDERING"
  | "RENDERED"
  | "REVALIDATING"
  | "DESTROYED";

/**
 * The `render` and `revalidate` protocols are basically generators. It would make sense to consider
 * using generators once all the requirements are fleshed out.
 */
class InternalRenderable {
  static render(renderable: Renderable): InternalRenderable {
    return new InternalRenderable(renderable);
  }

  #renderable: Renderable;
  #state: State = "INITIAL";

  constructor(renderable: Renderable) {
    this.#renderable = renderable;
  }

  get state(): State {
    return this.#state;
  }

  render(callbacks: { rendered: () => void; destroyed: () => void }) {
    if (this.#state === "DESTROYED") {
      callbacks.destroyed();
      // TODO: should this be allowed?
      return;
    }

    if (this.#renderable.render) {
      this.#state = "RENDERING";
      getValue(this.#renderable.render);
    }

    // synthesize async
    Promise.resolve().then(() => {
      if (this.#state === "DESTROYED") {
        return;
      }

      this.#state = "RENDERED";
      callbacks.rendered();
    });
  }

  revalidate(callbacks: { revalidated: () => void; destroyed: () => void }) {
    if (this.#state === "DESTROYED") {
      callbacks.destroyed();
      // TODO: should this be allowed?
      return;
    }

    if (this.#renderable.render) {
      this.#state = "REVALIDATING";
      getValue(this.#renderable.render);
    }

    // synthesize async
    Promise.resolve().then(() => {
      if (this.#state === "DESTROYED") {
        callbacks.destroyed();
        return;
      }

      this.#state = "RENDERED";
      callbacks.revalidated();
    });
  }

  teardown(): void {
    this.#state = "DESTROYED";
  }
}

class Waiting {
  #rendering = 0;
  #wait: Promise<void>;
  #fulfill!: () => void;
  #revalidate: Glimmer | null = null;
  #modifiers: Glimmer | null = null;

  constructor() {
    this.#wait = new Promise((fulfill) => {
      this.#fulfill = fulfill;
    });
  }

  #waitRender = async () => {
    while (this.#rendering !== 0) {
      await this.#promise();
    }
  };

  #runModifiers = () => {
    if (this.#modifiers) {
      let glimmer = this.#modifiers;
      this.#modifiers = null;
      glimmer.modifiers();

      if (this.#modifiers) {
        console.warn(
          `A modifier unexpectedly triggered another modifier. This is not expected, and should be avoided.`
        );
      }
    }
  };

  #runRevalidation = () => {
    if (this.#revalidate) {
      let glimmer = this.#revalidate;
      this.#revalidate = null;
      glimmer.poll();

      if (this.#rendering > 0) {
        throw new Error(
          `A revalidation unexpectedly triggered a top-level render. This is not allowed.`
        );
      }
    }
  };

  async wait(): Promise<void> {
    await this.#promise();
    await this.#waitRender();

    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (this.#modifiers) {
        while (this.#modifiers) {
          this.#runModifiers();
        }
      }

      this.#runRevalidation();

      if (this.#revalidate) {
        let revalidateCount = 0;
        while (this.#revalidate) {
          if (revalidateCount++ > 3) {
            throw new Error(
              `A revalidation loop was detected. This means that 3 revalidation steps occurred back-to-back, and each step triggered another revalidation. Instead of revalidation triggering revalidation, you should use 'measure' (TODO: details).`
            );
          }

          this.#runRevalidation();
        }
      }

      if (this.#modifiers === null) {
        break;
      }
    }
  }

  #promise = (): Promise<void> => {
    if (this.#rendering === 0) {
      return Promise.resolve();
    } else {
      return this.#wait;
    }
  };

  revalidate(glimmer: Glimmer) {
    this.#revalidate = glimmer;
  }

  modifiers(glimmer: Glimmer) {
    this.#modifiers = glimmer;
  }

  #checkingAfter = (first: () => void): (() => void) => {
    return () => {
      first();
      if (this.#rendering === 0) {
        this.#fulfill();
      }
    };
  };

  rendering(): () => void {
    this.#rendering++;
    return this.#checkingAfter(() => this.#rendering--);
  }
}

/**
 * `Glimmer` is a global coordinator for renderables. Each renderable registered with `Glimmer` has
 * a managed lifecycle, and `Glimmer` also provides a single `wait` function that tests can use to
 * wait for all managed renderables to settle.
 *
 * The lifecycle of an individual renderable is:
 *
 * - The renderable is registered and rendered (async)
 * - Once the renderable is done rendering, it is available to be revalidated.
 *
 * The lifecycle of `Glimmer` is:
 *
 * - Anytime a reactive cell is changed, all renderables that are available to be revalidated are
 *   enqueued to be revalidated.
 * - The `wait()` function returns a promise that is resolved:
 *   - immediately if no renderables are rendering or revalidating
 *   - once the number of renderables rendering or revalidating drops to 0
 */
class Glimmer {
  readonly #renderables: Set<InternalRenderable> = new Set();
  readonly #modifiers: Set<() => void> = new Set();
  readonly #waiting: Waiting = new Waiting();

  render(renderable: Renderable): { teardown: () => void } {
    let internal = InternalRenderable.render(renderable);
    this.#renderables.add(internal);

    let finished = this.#waiting.rendering();

    internal.render({
      rendered: () => {
        finished();
        this.#renderables.add(internal);
      },
      destroyed: finished,
    });

    return {
      teardown: () => {
        internal.teardown();
        this.#renderables.delete(internal);
      },
    };
  }

  enqueueModifier<E extends SimplestElement>(
    modifier: (element: E) => void,
    element: E
  ) {
    this.#modifiers.add(() => modifier(element));
    this.#waiting.modifiers(this);
  }

  wait(): Promise<void> {
    return this.#waiting.wait();
  }

  poll(): void {
    for (let renderable of this.#renderables) {
      renderable.revalidate({
        revalidated: () => {},
        destroyed: () => {},
      });
    }
  }

  modifiers(): void {
    let modifiers = [...this.#modifiers];
    this.#modifiers.clear();

    for (let modifier of modifiers) {
      modifier();
    }
  }

  revalidate(): void {
    this.#waiting.revalidate(this);
  }
}

export const GLIMMER = new Glimmer();
