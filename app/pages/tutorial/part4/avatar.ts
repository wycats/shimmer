import type { Dict, Reactive, StaticReactive } from "../../../../src/index";
import { component, Owner, text } from "../../../../src/index";
import { Classes, el, If, ModifiersSpec } from "../../utils";

export default component(
  (_owner: Owner) => (
    {
      title,
      initial,
      isActive,
    }: Dict<{
      title: Reactive<string>;
      initial: Reactive<string>;
      isActive: Reactive<boolean>;
    }>,
    attrs: StaticReactive<ModifiersSpec | undefined>
  ) =>
    el(
      "aside",
      attrs.now,
      el(
        "div",
        { class: Classes("avatar", If(isActive, "is-active", null)), title },
        text(initial)
      )
    )
);
