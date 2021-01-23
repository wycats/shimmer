import type { Invoke } from "@shimmer/core";
import { defDSL, text } from "@shimmer/dsl";
import type { Reactive } from "@shimmer/reactive";
import { Cond, el, ToBool } from "../../utils";

export default defDSL(
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
        args: {
          bool: ToBool(localTime),
        },
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
