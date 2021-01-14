import { registerDestructor } from "@glimmer/destroyable";
import {
  App,
  attr,
  Cell,
  Choice,
  component,
  Cursor,
  Dict,
  Doc,
  dom,
  each,
  effect,
  element,
  fragment,
  IntoReactive,
  match,
  Owner,
  Pure,
  Reactive,
  text,
  tree,
} from "../../src/index";
import { Bool } from "../choice";
import { Nav } from "./nav";

interface CountValue {
  id: number;
  value: number;
}

const on = effect(
  (
    element: dom.SimplestElement,
    eventName: Reactive<string>,
    callback: Reactive<EventListener>
  ) => {
    (element as Element).addEventListener(eventName.now, callback.now);
  }
);

// TODO:
// 1. make the proxy
// 2. catch using reactive values in static contexts

/**
 * IntoReactive -> Reactive
 *
 * 1. if IntoReactive is a primitive, return Reactive.static(it)
 * 2. if IntoReactive is a Reactive<T>, return it
 * 3. otherwise, return ReactiveProxy(it)
 *
 * external: Reactive#deref
 *
 * ReactiveProxy.get(object, key)
 *
 * 1. let inner = object[key]
 * 2. return IntoReactive(inner)
 */

export const Contact = component(
  () => (person: Dict<{ name: { first: string } }>) => {
    return text(Pure.of(() => person.name.first));
  }
);

export const Count = component(
  (owner: Owner) => (counter: Reactive<CountValue>) => {
    let secondary = Cell.of(rand());

    return fragment(
      Contact(owner)({
        name: {
          first: Pure.of(() => String(secondary.now)),
        },
      }),
      text(" "),
      element(
        "p",
        [
          attr(
            "class",
            Pure.of(() => `count-${counter.now.value}`)
          ),
        ],
        fragment(
          element(
            "button",
            [on("click", () => secondary.update(rand))],
            text("randomize")
          ),
          text(Pure.of(() => String(counter.now.value))),
          text("::"),
          element(
            "span",
            [attr("class", "count")],
            text(Pure.of(() => String(secondary.now)))
          )
        )
      )
    );
  }
);

function rand() {
  return Math.floor(Math.random() * 100);
}

type ReactiveCounts = Reactive<Iterable<IntoReactive<CountValue>>>;

const Texts = component((owner: Owner) => (counts: ReactiveCounts) => {
  return each<CountValue>(counts, (i) => String(i.id), Count(owner));
});

const Cond = component(() => (bool: Reactive<Choice<Bool>>) => {
  return match(bool, {
    true: text("true"),
    false: text("false"),
  });
});

const Hello = component(
  (owner: Owner) => (counts: ReactiveCounts, bool: Reactive<Choice<Bool>>) => {
    return fragment(Nav(owner)(), Texts(owner)(counts), Cond(owner)(bool));
  }
);

export class Main {
  static render(cursor: Cursor, owner: Owner): App {
    return new Main(owner, Doc.of(document)).render(cursor);
  }

  #doc: Doc;
  #tick: number = 0;
  #counts: Cell<Cell<CountValue>[]>;
  #bool: Cell<Choice<Bool>>;
  #owner: Owner;

  constructor(owner: Owner, doc: Doc) {
    this.#owner = owner;
    this.#doc = doc;

    let countValues: Cell<CountValue>[] = [];

    for (let i = 0; i < 10; i++) {
      countValues.push(Cell.of({ id: i, value: i }));
    }

    this.#counts = Reactive.cell(countValues);
    this.#bool = Cell.of(Bool.of("true", Reactive.static(true)));
  }

  render(cursor: Cursor): App {
    let hello = Hello(this.#owner)(this.#counts, this.#bool);
    console.log(tree(hello));

    let app = this.#doc.render(hello, cursor);

    let token = setInterval(() => this.increment(), 1000);
    registerDestructor(app, () => clearInterval(token));

    return app;
  }

  increment() {
    this.#tick++;
    console.log("tick", this.#tick);

    if (this.#tick % 2 === 0) {
      this.#counts.update((c) => {
        return c.map((value) => {
          let now = value.now;
          return Cell.of({ id: now.id, value: now.value + 1 });
        });
      });
    } else {
      this.#counts.now.forEach((c) =>
        c.update((i) => ({ id: i.id, value: i.value + 1 }))
      );
    }

    this.#bool.update((last) => {
      return last.match<Choice<Bool>>({
        true: () => Bool.of("false", Reactive.static(false)),
        false: () => Bool.of("true", Reactive.static(true)),
      });
    });
  }
}

// export function main() {}
