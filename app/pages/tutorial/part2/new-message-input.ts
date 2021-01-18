import { component, text } from "../../../../src/index";
import { el } from "../../utils";

export default component(() =>
  el("form", el("input"), el("button", { type: "submit" }, text("Send")))
);
