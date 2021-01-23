import { defDSL } from "@shimmer/dsl";
import { el } from "../../utils";

export default defDSL(() =>
  el("form", el("input"), el("button", { type: "submit" }, "Send"))
);
