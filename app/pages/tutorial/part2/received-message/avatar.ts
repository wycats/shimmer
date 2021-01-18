import { component, text } from "../../../../../src/index";
import { el } from "../../../utils";

export default component(() =>
  el(
    "aside",
    el(
      "div",
      { class: "avatar is-active", title: "Tomster's avatar" },
      text("T")
    )
  )
);
