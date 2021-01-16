import type {
  Dict,
  IntoModifiers,
  Reactive,
  StaticReactive,
} from "../../../../src/index";
import { component, Owner, text } from "../../../../src/index";
import { Classes, el, If } from "../../utils";

export default component(
  (_owner: Owner) => (
    args: Dict<{
      title: Reactive<string>;
      initial: Reactive<string>;
      isActive: Reactive<boolean>;
    }>,
    attrs: StaticReactive<IntoModifiers | undefined>
  ) => {
    let { title, initial, isActive } = args.now;

    return el(
      "aside",
      attrs.now,
      el(
        "div",
        { class: Classes("avatar", If(isActive, "is-active", null)), title },
        text(initial)
      )
    );
  }
);
