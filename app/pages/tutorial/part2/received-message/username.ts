import { def } from "@shimmer/dsl";
import { el } from "../../../utils";

export default def(() =>
  el(
    "h4",
    { class: "username" },
    "Tomster",
    el("span", { class: "local-time" }, "their local time is 4:56pm")
  )
);
