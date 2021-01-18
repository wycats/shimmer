import {
  assert,
  diffArray,
  enumerate,
  keyedArray,
  KeyedNode,
  unwrap,
  zip,
} from "../../src/index";

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
    newArray.splice(to, 0, unwrap(obj));

    trace("move  ", { header: { from, to }, object, newArray });
  },
});

function trace(
  kind: string,
  {
    header,
    object,
    newArray,
  }: { header: object; object: object; newArray: KeyedNode<unknown>[] }
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
