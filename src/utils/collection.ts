export function* zip<T, U>(
  left: Iterable<T>,
  right: Iterable<U>
): IterableIterator<[T, U, number]> {
  let l = left[Symbol.iterator]();
  let r = right[Symbol.iterator]();

  let i = 0;

  while (true) {
    let nextLeft = l.next();
    let nextRight = r.next();

    if (nextLeft.done && nextRight.done) {
      return;
    } else if (nextLeft.done && !nextRight.done) {
      throw new Error(
        `The right side in a zip was bigger than the left side. They must be the same size`
      );
    } else if (!nextLeft.done && nextRight.done) {
      throw new Error(
        `The left side in a zip was bigger than the right side. They must be the same size`
      );
    }

    yield [nextLeft.value, nextRight.value, i++];
  }
}
