import {
  Cell,
  def,
  EFFECTS,
  fragment,
  Pure,
  Reactive,
  text,
} from "../../../src/index";
import { el, on } from "../utils";

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
      el("p", text(Pure.of(() => String(count.now)))),
      el("p", text("× "), text(Pure.of(() => String(multiple.now)))),
      el("p", text("= "), text(total)),

      el(
        "button",
        { type: "button", [EFFECTS]: [on("click", change(1))] },
        text("+1")
      ),
      el(
        "button",
        { type: "button", [EFFECTS]: [on("click", change(-1))] },
        text("-1")
      ),
      el(
        "button",
        {
          type: "button",
          [EFFECTS]: [
            on("click", () => updateMultiple.now((prev) => prev * 2)),
          ],
        },
        text("Double It")
      )
    );
  }
);
