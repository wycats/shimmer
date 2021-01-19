import { def } from "../../../../src/index";
import { el } from "../../utils";

export default def(() =>
  el("form", el("input"), el("button", { type: "submit" }, "Send"))
);
