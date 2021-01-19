import { def, Invoke, Reactive, text } from "../../../../src/index";
import { Cond, el, ToBool } from "../../utils";

export default def(
  ({
    $,
    args: { name, localTime },
  }: {
    $: Invoke;
    args: {
      name: Reactive<string>;
      localTime: Reactive<string | undefined>;
    };
  }) => {
    return el(
      "h4",
      { class: "username" },
      text(name),
      $(Cond, {
        args: { bool: ToBool(localTime) },
        blocks: {
          ifTrue: el(
            "span",
            { class: "local-time" },
            "their local time is ",
            text(localTime as Reactive<string>)
          ),
        },
      })
    );
  }
);
