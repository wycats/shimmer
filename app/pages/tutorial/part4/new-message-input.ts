import { component, Owner, text } from "../../../../src/index";
import { el } from "../../utils";

export default component((owner: Owner) => () =>
  el("form", el("input"), el("button", { type: "submit" }, text("Send")))
);
