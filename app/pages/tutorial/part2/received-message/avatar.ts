import { def } from "../../../../../src/index";
import { el } from "../../../utils";

export default def(() =>
  el(
    "aside",
    el("div", { class: "avatar is-active", title: "Tomster's avatar" }, "T")
  )
);
