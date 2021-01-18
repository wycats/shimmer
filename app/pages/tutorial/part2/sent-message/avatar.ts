import { component, text } from "../../../../../src/index";
import { el } from "../../../utils";

export default component(() =>
  el(
    "aside",
    { class: "current-user" },
    el("div", { class: "avatar", title: "Zoey's avatar" }, text("Z"))
  )
);
