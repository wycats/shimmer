import { getPatch, Patch } from "fast-array-diff";
import { enumerate } from "../utils/collection";

export class WrapperNode<T> {
  constructor(readonly key: unknown, readonly inner: T) {}
}

export class Insert<T> {
  constructor(readonly content: WrapperNode<T>, readonly before: number) {}
}

export class Move<T> {
  constructor(readonly node: WrapperNode<T>, readonly to: number) {}
}

export class Remove<T> {
  constructor(readonly node: T, readonly from: number) {}
}

export type Op<T> = Insert<T> | Move<T> | Remove<T>;

interface Application<Insertion, Inserted> {
  // The `from` number is the location of the node to remove at the point that the callback was
  // called.
  remove: (value: Inserted, from: number) => void;

  // The `before` number is the location of the immediately following node at the point that the
  // callback was called.
  insert: (value: WrapperNode<Insertion>, before: number) => void;

  // The `from` number is the location of the node at the point that the callback is called. The
  // `to` number is the location of the node *after* the node was removed.
  move: (value: WrapperNode<Inserted>, from: number, to: number) => void;
}

export class Patches<Insertion, Inserted> {
  #move: readonly Move<Inserted>[];
  #insert: readonly Insert<Insertion>[];
  #remove: readonly Remove<Inserted>[];

  constructor(
    move: readonly Move<Inserted>[],
    insert: readonly Insert<Insertion>[],
    remove: readonly Remove<Inserted>[]
  ) {
    this.#move = move;
    this.#insert = insert;
    this.#remove = remove;
  }

  applyPatch(
    array: WrapperNode<Inserted>[],
    application: Application<Insertion, Inserted>
  ) {
    for (let remove of this.#remove) {
      application.remove(remove.node, remove.from);
    }

    for (let insert of this.#insert) {
      application.insert(insert.content, insert.before);
    }

    for (let move of this.#move) {
      let from = array.findIndex((item) => item.key === move.node.key);
      application.move(move.node, from, move.to);
    }
  }
}

export function keyedArray<T>(
  values: readonly T[],
  key: (a: T) => unknown
): readonly WrapperNode<T>[] {
  return values.map((v) => new WrapperNode(key(v), v));
}

export function diffArray<Insertion, Inserted>(
  prev: readonly WrapperNode<Inserted>[],
  next: readonly WrapperNode<Insertion | Inserted>[]
): Patches<Insertion, Inserted> {
  // let next = nextValues.map((v) => new WrapperNode(key(v), v));

  let patch = getPatch([...prev], [...next], (a, b) => a.key === b.key);

  return normalize<Insertion, Inserted>(patch);
}

export function normalize<Insertion, Inserted>(
  patch: Patch<WrapperNode<Insertion | Inserted>>
): Patches<Insertion, Inserted> {
  let inserted: Set<unknown> = new Set();
  let removed: Set<unknown> = new Set();

  let moves: Move<Inserted>[] = [];
  let removes: Remove<Inserted>[] = [];
  let inserts: Insert<Insertion>[] = [];

  for (let patchItem of patch) {
    if (patchItem.type === "add") {
      for (let insertion of patchItem.items) {
        inserted.add(insertion.key);
      }
    } else if (patchItem.type === "remove") {
      for (let removal of patchItem.items) {
        removed.add(removal.key);
      }
    }
  }

  for (let patchItem of patch) {
    switch (patchItem.type) {
      case "remove": {
        for (let [removal, i] of enumerate(patchItem.items)) {
          if (inserted.has(removal.key)) {
            // do nothing; this turns into a move on the insertion side
          } else {
            removes.push(
              new Remove(removal.inner as Inserted, patchItem.oldPos + i)
            );
          }
        }
        break;
      }
      case "add": {
        for (let [insertion, i] of enumerate(patchItem.items)) {
          if (removed.has(insertion.key)) {
            moves.push(
              new Move(insertion as WrapperNode<Inserted>, patchItem.newPos + i)
            );
          } else {
            inserts.push(
              new Insert(
                insertion as WrapperNode<Insertion>,
                patchItem.newPos + i
              )
            );
          }
        }
        break;
      }
    }
  }

  return new Patches(moves, inserts, removes);
}
