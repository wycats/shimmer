import type { Modifiers } from "@shimmer/core";
import { defDSL, text } from "@shimmer/dsl";
import type { Reactive } from "@shimmer/reactive";
import { Classes, el, If } from "../../utils";

export default defDSL(
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
