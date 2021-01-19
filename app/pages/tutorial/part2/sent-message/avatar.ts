import { def } from "../../../../../src/index";
import { el } from "../../../utils";

export default def(() =>
  el(
    "aside",
    { class: "current-user" },
    el("div", { class: "avatar", title: "Zoey's avatar" }, "Z")
  )
);
