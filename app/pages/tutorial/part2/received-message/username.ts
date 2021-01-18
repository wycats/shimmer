import { component, Owner, text } from "../../../../../src/index";
import { el } from "../../../utils";

export default component((_owner: Owner) => () =>
  el(
    "h4",
    { class: "username" },
    text("Tomster"),
    el("span", { class: "local-time" }, text("their local time is 4:56pm"))
  )
);
