import { component, Owner, text } from "../../../../../src/index";
import { el } from "../../../utils";

export default component((_owner: Owner) => () =>
  el("h4", { class: "username" }, text("Zoey"))
);
