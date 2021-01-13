import type { SimplestElement } from "../../src/dom/simplest";
import {
  App,
  Cell,
  Choice,
  Cursor,
  Doc,
  fragment,
  GLIMMER,
  match,
  Pure,
  Reactive,
  text,
  tree,
} from "../../src/index";
import { component } from "../../src/nodes/component";
import { attr } from "../../src/nodes/element/attribute";
import { element } from "../../src/nodes/element/element";
import { effect } from "../../src/nodes/element/element-effect";
import { each } from "../../src/nodes/structure/each";
import type { Dict } from "../../src/reactive/collection";
import { Bool } from "../choice";

interface CountValue {
  id: number;
  value: number;
}

let countValues: Cell<CountValue>[] = [];

for (let i = 0; i < 10; i++) {
  countValues.push(Cell.of({ id: i, value: i }));
}

let counts = Reactive.cell(countValues);

export const bool: Cell<Choice<Bool>> = Cell.of(
  Bool.of("true", Reactive.static(true))
);

export const cond = match(bool, {
  true: text("true"),
  false: text("false"),
});

const on = effect(
  (
    element: SimplestElement,
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

export const contact = component(
  (person: Dict<{ name: { first: string } }>) => {
    return text(Pure.of(() => person.name.first));
  }
);

export const Count = component((counter: Reactive<CountValue>) => {
  let secondary = Cell.of(rand());

  return fragment(
    contact({
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
});

function rand() {
  return Math.floor(Math.random() * 100);
}

let texts = each(counts, (i) => String(i.id), Count);

const hello = fragment(texts, text(" "), cond);

let tick = 0;

function increment() {
  tick++;

  if (tick % 2 === 0) {
    counts.update((c) => {
      return c.map((value) => {
        let now = value.now;
        return Cell.of({ id: now.id, value: now.value + 1 });
      });
    });
  } else {
    counts.now.forEach((c) =>
      c.update((i) => ({ id: i.id, value: i.value + 1 }))
    );
  }

  bool.update((last) => {
    return last.match<Choice<Bool>>({
      true: () => Bool.of("false", Reactive.static(false)),
      false: () => Bool.of("true", Reactive.static(true)),
    });
  });
}

console.log(tree(hello));

export class Main {
  static render(): App {
    return new Main(Doc.of(document)).render();
  }

  #doc: Doc;

  constructor(doc: Doc) {
    this.#doc = doc;
  }

  render(): App {
    let renderable = this.#doc.render(hello, Cursor.appending(document.body));
    GLIMMER.addRenderable(renderable);

    return renderable;
  }
}

// export function main() {}

setInterval(increment, 1000);
