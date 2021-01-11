import type { SimplestElement } from "../src/dom/simplest";
import {
  Cell,
  Choice,
  Content,
  Cursor,
  Doc,
  fragment,
  GLIMMER,
  match,
  PresentArray,
  Pure,
  Reactive,
  text,
  tree,
} from "../src/index";
import { component } from "../src/nodes/component";
import { attr } from "../src/nodes/element/attribute";
import { element } from "../src/nodes/element/element";
import { effect } from "../src/nodes/element/element-effect";
import type { Dict } from "../src/reactive/collection";
import { Bool } from "./choice";

let counts: Cell<number>[] = [];

for (let i = 0; i < 10; i++) {
  counts.push(Cell.of(i));
}

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

export const count = component((counter: Reactive<number>) => {
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
          Pure.of(() => `count-${counter.now}`)
        ),
      ],
      fragment(
        element(
          "button",
          [on("click", () => secondary.update(rand))],
          text("randomize")
        ),
        text(Pure.of(() => String(counter.now))),
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

let texts = counts.map((c) => count(c)) as PresentArray<Content>;

const hello = fragment(...texts, text(" "), cond);

function increment() {
  counts.forEach((c) => c.update((i) => i + 1));
  bool.update((last) => {
    return last.match<Choice<Bool>>({
      true: () => Bool.of("false", Reactive.static(false)),
      false: () => Bool.of("true", Reactive.static(true)),
    });
  });
}

console.log(tree(hello));

const DOC = Doc.of(document);
GLIMMER.addRenderable(DOC.render(hello, Cursor.appending(document.body)));

setInterval(increment, 1000);
