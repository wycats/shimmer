import type { Modifiers } from "@shimmer/core";
import { def, html } from "@shimmer/dsl";
import type { Reactive } from "@shimmer/reactive";
import { Classes, If } from "../../utils";

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
    return html.aside(
      attrs,
      html.div(
        { class: Classes("avatar", If(isActive, "is-active", null)), title },
        initial
      )
    );
  }
);
