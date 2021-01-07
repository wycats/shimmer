import { assert } from "../src/assertions";
import {
  Cell,
  Content,
  Cursor,
  Doc,
  GLIMMER,
  Pure,
  text,
  tree,
} from "../src/index";
import { fragment } from "../src/nodes/fragment";
import { zip } from "../src/utils/collection";
import { PresentArray } from "../src/utils/type";

let stable = Cell.of("✅");

let counts: Cell<number>[] = [];

for (let i = 0; i < 10; i++) {
  counts.push(Cell.of(i));
}

let texts = counts.flatMap((c) => [
  fragment(text(" "), text(Pure.of(() => String(c.current)))),
]) as PresentArray<Content>;

const hello = fragment(...texts, text(stable));

function increment() {
  counts.forEach((c) => c.update((i) => i + 1));
}

console.log(tree(hello));

const DOC = Doc.of(document);
GLIMMER.addRenderable(DOC.render(hello, Cursor.appending(document.body)));

let snapshot = [...document.body.childNodes];

GLIMMER.addAssertion(() => {
  let current = [...document.body.childNodes];

  if (snapshot.length !== current.length) {
    let msg = `⛔ Expected stability. Instead: snapshot had ${snapshot.length} nodes, but the body now has ${current.length} nodes`;

    console.assert(msg);
    stable.update(() => msg);
    return;
  }

  for (let [c, s, i] of zip(current, snapshot)) {
    if (c !== s) {
      let msg = `⛔ Expected stability. Instead: item ${i} differed between the snapshot and the current value`;

      console.assert(msg);
      stable.update(() => msg);
      return;
    }
  }
});

setInterval(increment, 1000);
