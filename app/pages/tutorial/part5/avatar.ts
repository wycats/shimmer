import type { Modifiers, Reactive } from "@shimmer/core";
import { def, text } from "@shimmer/dsl";
import { Classes, el, If } from "../../utils";

export default def(
  ({
    args: { title, initial, isActive },
    attrs,
  }: {
    args: {
      title: Reactive<string>;
      initial: Reactive<string>;
      isActive: Reactive<boolean>;
    };
    attrs: Modifiers;
  }) => {
    return el(
      "aside",
      attrs,
      el(
        "div",
        { class: Classes("avatar", If(isActive, "is-active", null)), title },
        text(initial)
      )
    );
  }
);
