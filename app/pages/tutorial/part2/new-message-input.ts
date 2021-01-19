import { def } from "@shimmer/dsl";
import { el } from "../../utils";

export default def(() =>
  el("form", el("input"), el("button", { type: "submit" }, "Send"))
);
