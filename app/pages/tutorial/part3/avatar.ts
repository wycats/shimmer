import type { Invoke, Modifiers, Reactive } from "../../../../src/index";
import { component, text } from "../../../../src/index";
import { Classes, el, If } from "../../utils";

export default component(
  ({
    $,
    args: { title, initial, isActive },
    attrs,
  }: {
    $: Invoke;
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
