import type { Modifiers, Reactive } from "../../../../src/index";
import { component, Owner, text } from "../../../../src/index";
import { Classes, el, If } from "../../utils";

export default component(
  (_owner: Owner) => ({
    args: { title, initial, isActive },
    attrs,
  }: {
    args: {
      title: Reactive<string>;
      initial: Reactive<string>;
      isActive: Reactive<boolean>;
    };
    attrs?: Modifiers;
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
