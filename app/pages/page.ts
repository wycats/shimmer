import type { App, Cursor, Owner } from "../../src/index";

export interface StaticOptions {
  owner: Owner;
}

export interface RenderOptions {
  cursor: Cursor;
}

export type Page<State> = (
  staticOptions: StaticOptions,
  renderOptions: RenderOptions
) => PageHooks<State>;

export interface PageHooks<State> {
  construct(owner: Owner): State;
  render(
    state: State,
    staticOptions: StaticOptions,
    renderOptions: RenderOptions
  ): App;
}

export function page<State>(
  callback: () => PageHooks<State>
): (owner: Owner) => (cursor: Cursor) => App {
  return (owner: Owner) => {
    let hooks = callback();
    let state = hooks.construct(owner);
    let rendered = new RenderedPage(owner, state, hooks);

    return (cursor: Cursor) => rendered.render(cursor);
  };
}

export class RenderedPage<State> {
  #owner: Owner;
  #hooks: PageHooks<State>;
  #state: State;

  constructor(owner: Owner, state: State, hooks: PageHooks<State>) {
    this.#owner = owner;
    this.#hooks = hooks;
    this.#state = state;
  }

  protected get owner(): Owner {
    return this.#owner;
  }

  render(cursor: Cursor): App {
    return this.#hooks.render(
      this.#state,
      { owner: this.#owner },
      {
        cursor,
      }
    );
  }
}

// export class Main {
//   static render(cursor: Cursor, owner: Owner): App {
//     return new Main(owner, Doc.of(document)).render(cursor);
//   }

//   #doc: Doc;
//   #tick: number = 0;
//   #counts: Cell<Cell<CountValue>[]>;
//   #bool: Cell<Choice<Bool>>;
//   #owner: Owner;

//   constructor(owner: Owner, doc: Doc) {
//     this.#owner = owner;
//     this.#doc = doc;

//     let countValues: Cell<CountValue>[] = [];

//     for (let i = 0; i < 10; i++) {
//       countValues.push(Cell.of({ id: i, value: i }));
//     }

//     this.#counts = Reactive.cell(countValues);
//     this.#bool = Cell.of(Bool.of("true", Reactive.static(true)));
//   }

//   render(cursor: Cursor): App {
//     let hello = Hello(this.#owner)(this.#counts, this.#bool);
//     console.log(tree(hello));

//     let app = this.#doc.render(hello, cursor);

//     let token = setInterval(() => this.increment(), 1000);
//     registerDestructor(app, () => clearInterval(token));

//     return app;
//   }

//   increment() {
//     this.#tick++;
//     console.log("tick", this.#tick);

//     if (this.#tick % 2 === 0) {
//       this.#counts.update((c) => {
//         return c.map((value) => {
//           let now = value.now;
//           return Cell.of({ id: now.id, value: now.value + 1 });
//         });
//       });
//     } else {
//       this.#counts.now.forEach((c) =>
//         c.update((i) => ({ id: i.id, value: i.value + 1 }))
//       );
//     }

//     this.#bool.update((last) => {
//       return last.match<Choice<Bool>>({
//         true: () => Bool.of("false", Reactive.static(false)),
//         false: () => Bool.of("true", Reactive.static(true)),
//       });
//     });
//   }
// }
