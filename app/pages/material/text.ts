import { MDCTextField } from "@material/textfield";
import { def, effect, html } from "@shimmer/dsl";

export default def(() =>
  html.div[".mdc-text-field.food-field"](
    [effect((element) => new MDCTextField(element))],
    html.input[".mdc-text-field__input"].attr("type", "text")(),
    html.label[".mdc-floating-label"].attr(
      "for",
      "my-text-field"
    )("Favorite food"),
    html.div[".mdc-line-ripple.eat-button"]()
  )
);
