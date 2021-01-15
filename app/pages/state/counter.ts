import {
  Cell,
  component,
  Dict,
  fragment,
  Owner,
  Pure,
  Reactive,
  Static,
  text,
} from "../../../src/index";
import { EFFECTS, el, on } from "../utils";

export default component((owner: Owner) => () => {
  const multiple = Cell.of(1);

  return fragment(
    Counter(owner)({
      multiple,
      updateMultiple: (callback: (prev: number) => number) =>
        multiple.update(callback),
    })
  );
});

const Counter = component(
  (owner: Owner) => ({
    updateMultiple: { now: updateMultiple },
    multiple,
  }: Dict<{
    multiple: Reactive<number>;
    updateMultiple: Static<(callback: (prev: number) => number) => void>;
  }>) => {
    let count = Cell.of(0);
    // let multiple = Cell.of(1);

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
          [EFFECTS]: [on("click", () => updateMultiple((prev) => prev * 2))],
        },
        text("Double It")
      )
    );
  }
);
