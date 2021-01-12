// https://github.com/derbyjs/arraydiff
//
// License: MIT
// Original Author: Nate Smith

// Based on some rough benchmarking, this algorithm is about O(2n) worst case,
// and it can compute diffs on random arrays of length 1024 in about 34ms,
// though just a few changes on an array of length 1024 takes about 0.5ms

export type Diff<T> = InsertDiff<T> | RemoveDiff | MoveDiff;

export class InsertDiff<T> {
  readonly type = "insert";
  constructor(readonly index: number, readonly values: T[]) {}

  toJSON() {
    return {
      type: this.type,
      index: this.index,
      values: this.values,
    };
  }
}

export class RemoveDiff {
  readonly type = "remove";
  constructor(readonly index: number, readonly howMany: number) {}

  withIndex(index: number): RemoveDiff {
    return new RemoveDiff(index, this.howMany);
  }

  toJSON() {
    return {
      type: this.type,
      index: this.index,
      howMany: this.howMany,
    };
  }
}

export class MoveDiff {
  readonly type = "move";
  constructor(
    readonly from: number,
    readonly to: number,
    readonly howMany: number
  ) {}

  withFrom(from: number): MoveDiff {
    return new MoveDiff(from, this.to, this.howMany);
  }

  withTo(to: number): MoveDiff {
    return new MoveDiff(this.from, to, this.howMany);
  }

  toJSON() {
    return {
      type: this.type,
      from: this.from,
      to: this.to,
      howMany: this.howMany,
    };
  }
}

function strictEqual(a: unknown, b: unknown): boolean {
  return a === b;
}

export function diff<T>(
  before: T[],
  after: T[],
  equalFn: (a: T, b: T) => boolean
): Diff<T>[] {
  if (!equalFn) equalFn = strictEqual;

  // Find all items in both the before and after array, and represent them
  // as moves. Many of these "moves" may end up being discarded in the last
  // pass if they are from an index to the same index, but we don't know this
  // up front, since we haven't yet offset the indices.
  //
  // Also keep a map of all the indices accounted for in the before and after
  // arrays. These maps are used next to create insert and remove diffs.
  let beforeLength = before.length;
  let afterLength = after.length;
  let moves: MoveDiff[] = [];
  let beforeMarked: Record<string, boolean | undefined> = {};
  let afterMarked: Record<string, boolean | undefined> = {};
  for (let beforeIndex = 0; beforeIndex < beforeLength; beforeIndex++) {
    let beforeItem = before[beforeIndex]!;
    for (let afterIndex = 0; afterIndex < afterLength; afterIndex++) {
      if (afterMarked[afterIndex]) continue;
      if (!equalFn(beforeItem, after[afterIndex]!)) continue;
      let from = beforeIndex;
      let to = afterIndex;
      let howMany = 0;
      do {
        beforeMarked[beforeIndex++] = afterMarked[afterIndex++] = true;
        howMany++;
      } while (
        beforeIndex < beforeLength &&
        afterIndex < afterLength &&
        equalFn(before[beforeIndex]!, after[afterIndex]!) &&
        !afterMarked[afterIndex]
      );
      moves.push(new MoveDiff(from, to, howMany));
      beforeIndex--;
      break;
    }
  }

  // Create a remove for all of the items in the before array that were
  // not marked as being matched in the after array as well
  let removes: RemoveDiff[] = [];
  for (let beforeIndex = 0; beforeIndex < beforeLength; ) {
    if (beforeMarked[beforeIndex]) {
      beforeIndex++;
      continue;
    }
    let index = beforeIndex;
    let howMany = 0;
    while (beforeIndex < beforeLength && !beforeMarked[beforeIndex++]) {
      howMany++;
    }
    removes.push(new RemoveDiff(index, howMany));
  }

  // Create an insert for all of the items in the after array that were
  // not marked as being matched in the before array as well
  let inserts = [];
  for (let afterIndex = 0; afterIndex < afterLength; ) {
    if (afterMarked[afterIndex]) {
      afterIndex++;
      continue;
    }
    let index = afterIndex;
    let howMany = 0;
    while (afterIndex < afterLength && !afterMarked[afterIndex++]) {
      howMany++;
    }
    let values = after.slice(index, index + howMany);
    inserts.push(new InsertDiff(index, values));
  }

  let insertsLength = inserts.length;
  let removesLength = removes.length;
  let movesLength = moves.length;

  let j;

  // Offset subsequent removes and moves by removes
  let count = 0;
  for (let i = 0; i < removesLength; i++) {
    let remove = removes[i]!;
    remove = removes[i] = remove.withIndex(remove.index - count);
    count += remove.howMany;
    for (j = 0; j < movesLength; j++) {
      let move = moves[j]!;
      if (move.from >= remove.index) {
        moves[j] = move.withFrom(move.from - remove.howMany);
      }
    }
  }

  // Offset moves by inserts
  for (let i = insertsLength; i--; ) {
    let insert = inserts[i]!;
    let howMany = insert.values.length;
    for (j = movesLength; j--; ) {
      let move = moves[j]!;
      if (move.to >= insert.index) {
        moves[j] = move.withTo(move.to - howMany);
      }
    }
  }

  // Offset the to of moves by later moves
  for (let i = movesLength; i-- > 1; ) {
    let move = moves[i]!;
    if (move.to === move.from) continue;
    for (j = i; j--; ) {
      let earlier = moves[j]!;
      if (earlier.to >= move.to) {
        earlier = earlier.withTo(earlier.to - move.howMany);
      }
      if (earlier.to >= move.from) {
        earlier = earlier.withTo(earlier.to + move.howMany);
      }
      moves[j] = earlier;
    }
  }

  // Only output moves that end up having an effect after offsetting
  let outputMoves: MoveDiff[] = [];

  // Offset the from of moves by earlier moves
  for (let i = 0; i < movesLength; i++) {
    let move = moves[i]!;
    if (move.to === move.from) continue;
    outputMoves.push(move);
    for (j = i + 1; j < movesLength; j++) {
      let later = moves[j]!;
      if (later.from >= move.from) {
        later = later.withFrom(later.from - move.howMany);
      }

      if (later.from >= move.to) {
        later = later.withFrom(later.from + move.howMany);
      }

      moves[j] = later;
    }
  }

  return [...removes, ...outputMoves, ...inserts];
}
