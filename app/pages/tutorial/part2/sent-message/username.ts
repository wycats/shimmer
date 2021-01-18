import { component, text } from "../../../../../src/index";
import { el } from "../../../utils";

export default component(() => el("h4", { class: "username" }, text("Zoey")));
