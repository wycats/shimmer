import { assert } from "../src/assertions";
import type { SimplestElement } from "../src/dom/simplest";
import {
  Cell,
  Choice,
  Cursor,
  diffArray,
  Doc,
  enumerate,
  fragment,
  GLIMMER,
  keyedArray,
  match,
  Pure,
  Reactive,
  text,
  tree,
  WrapperNode,
  zip,
} from "../src/index";
import { component } from "../src/nodes/component";
import { attr } from "../src/nodes/element/attribute";
import { element } from "../src/nodes/element/element";
import { effect } from "../src/nodes/element/element-effect";
import { each } from "../src/nodes/structure/each";
import type { Dict } from "../src/reactive/collection";
import { Bool } from "./choice";

// function normalize()

interface Person {
  id: number;
  name: string;
}

let array: Person[] = [
  { id: 1, name: "Tom" },
  { id: 3, name: "Robert" },
  { id: 4, name: "Godfrey" },
  { id: 2, name: "Yehuda" },
  { id: 5, name: "Jen" },
  { id: 6, name: "Katie" },
];

let initial = keyedArray(array, (a) => a.id);

let patch = diffArray(
  initial,
  keyedArray(
    [
      { id: 2, name: "Yehuda" },
      { id: 7, name: "Melanie" },
      { id: 3, name: "Robert" },
      { id: 4, name: "Godfrey" },
      { id: 1, name: "Tom" },
      { id: 6, name: "Katie" },
      { id: 8, name: "Krati" },
    ],
    (a) => a.id
  )
);

let newArray = [...initial];

patch.applyPatch(newArray, {
  remove: (object, from) => {
    newArray.splice(from, 1);

    trace("remove", { header: { from }, object, newArray });
  },
  insert: (object, before) => {
    newArray.splice(before, 0, object);

    trace("insert", { header: { before }, object, newArray });
  },
  move: (object, from, to) => {
    let [obj] = newArray.splice(from, 1);
    newArray.splice(to, 0, obj!);

    trace("move  ", { header: { from, to }, object, newArray });
  },
});

function trace(
  kind: string,
  {
    header,
    object,
    newArray,
  }: { header: object; object: object; newArray: WrapperNode<unknown>[] }
) {
  console.groupCollapsed(`step: ${kind}  `, header);
  console.log("object    =", object);
  console.log(
    "new array =",
    newArray.map((a) => a.inner)
  );
  console.groupEnd();
}

console.log({ prev: array, next: newArray.map((a) => a.inner) });

// steps:
//
// Start
//
// { id: 1, name: "Tom" }
// { id: 3, name: "Robert" }
// { id: 4, name: "Godfrey" }
// { id: 2, name: "Yehuda" }
// { id: 5, name: "Jen" }
// { id: 6, name: "Katie" }
//
//
// Remove Jen from 4
//
// { id: 1, name: "Tom" }
// { id: 3, name: "Robert" }
// { id: 4, name: "Godfrey" }
// { id: 2, name: "Yehuda" }
// { id: 6, name: "Katie" }
//
//
// Insert Melanie before 1
//
// { id: 1, name: "Tom" }
// { id: 7, name: "Melanie" }
// { id: 3, name: "Robert" }
// { id: 4, name: "Godfrey" }
// { id: 2, name: "Yehuda" }
// { id: 6, name: "Katie" }
//
//
// Insert Krati before 6
//
// { id: 1, name: "Tom" }
// { id: 7, name: "Melanie" }
// { id: 3, name: "Robert" }
// { id: 4, name: "Godfrey" }
// { id: 2, name: "Yehuda" }
// { id: 6, name: "Katie" }
// { id: 8, name: "Krati" }
//
//
// Move Yehuda to 0
//
// { id: 2, name: "Yehuda" }
// { id: 1, name: "Tom" }
// { id: 7, name: "Melanie" }
// { id: 3, name: "Robert" }
// { id: 4, name: "Godfrey" }
// { id: 6, name: "Katie" }
// { id: 8, name: "Krati" }
//
//
// Move Tom to 4
//
// { id: 2, name: "Yehuda" }
// { id: 7, name: "Melanie" }
// { id: 3, name: "Robert" }
// { id: 4, name: "Godfrey" }
// { id: 1, name: "Tom" }
// { id: 6, name: "Katie" }
// { id: 8, name: "Krati" }

assertItems(
  newArray.map((a) => a.inner),
  [
    { id: 2, name: "Yehuda" },
    { id: 7, name: "Melanie" },
    { id: 3, name: "Robert" },
    { id: 4, name: "Godfrey" },
    { id: 1, name: "Tom" },
    { id: 6, name: "Katie" },
    { id: 8, name: "Krati" },
  ]
);

function assertItems(actual: Person[], expected: Person[]): void {
  assert(
    actual.length === expected.length,
    `the actual items didn't match the expected items.`
  );

  for (let [[left, right], i] of enumerate(zip(actual, expected))) {
    assert(
      left.id === right.id,
      `Item #${i} had the wrong id. Expected ${right.id}, got ${left.id}`
    );

    assert(
      left.name === right.name,
      `Item #${i} had the wrong name. Expected ${right.name}, got ${left.name}`
    );
  }
}

console.log("patch", patch);
// console.log("normalized", normalize(patch));

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

const DOC = Doc.of(document);
GLIMMER.addRenderable(DOC.render(hello, Cursor.appending(document.body)));

setInterval(increment, 1000);
