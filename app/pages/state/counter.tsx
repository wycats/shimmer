import { def } from "@shimmer/dsl";
import { Cell, Reactive } from "@shimmer/reactive";
import { on } from "../utils";

export default def(() => {
  const multiple = Cell.of(1);

  return (
    <>
      <Counter
        multiple={multiple}
        updateMultiple={(callback: (prev: number) => number) =>
          multiple.update(callback)
        }
      />
    </>
  );
});

const Counter = def(
  ({
    multiple,
    updateMultiple,
  }: {
    multiple: Reactive<number>;
    updateMultiple: Reactive<(callback: (prev: number) => number) => void>;
  }) => {
    let count = Cell.of(0);

    const change = (amount: number) => () =>
      count.update((prev) => prev + amount);

    return (
      <>
        <p>{count}</p>
        <p>× {multiple}</p>
        <p>= {() => count.now * multiple.now}</p>
        <button type="button" use-effect={on("click", change(1))}>
          +1
        </button>{" "}
        <button type="button" use-effect={on("click", change(-1))}>
          -1
        </button>
        <button
          type="button"
          use-effect={on("click", () => updateMultiple.now((prev) => prev * 2))}
        >
          Double It
        </button>
      </>
    );
  }
);
