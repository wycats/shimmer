import { EFFECTS } from "@shimmer/core";
import { def, fragment, html } from "@shimmer/dsl";
import { Cell, Pure, Reactive } from "@shimmer/reactive";
import { on } from "../utils";

export default def(({ $ }) => {
  const multiple = Cell.of(1);

  return fragment(
    $(Counter, {
      args: {
        multiple,
        updateMultiple: (callback: (prev: number) => number) =>
          multiple.update(callback),
      },
    })
  );
});

const Counter = def(
  ({
    args: { multiple, updateMultiple },
  }: {
    args: {
      multiple: Reactive<number>;
      updateMultiple: Reactive<(callback: (prev: number) => number) => void>;
    };
  }) => {
    let count = Cell.of(0);

    const change = (amount: number) => () =>
      count.update((prev) => prev + amount);

    const total = Pure.of(() => String(count.now * multiple.now));

    return fragment(
      html.p(Pure.of(() => String(count.now))),
      html.p(
        "× ",
        Pure.of(() => String(multiple.now))
      ),
      html.p("= ", total),

      html.button(
        { type: "button", [EFFECTS]: [on("click", change(1))] },
        "+1"
      ),
      html.button(
        { type: "button", [EFFECTS]: [on("click", change(-1))] },
        "-1"
      ),
      html.button(
        {
          type: "button",
          [EFFECTS]: [
            on("click", () => updateMultiple.now((prev) => prev * 2)),
          ],
        },
        "Double It"
      )
    );
  }
);
