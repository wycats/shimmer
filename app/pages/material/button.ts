import { MDCRipple } from "@material/ripple";
import { def, effect, html } from "@shimmer/dsl";

export default def(() =>
  html.button[".mdc-button.eat-button"](
    [effect((element) => new MDCRipple(element))],
    html.div[".mdc-button__ripple"](),
    html.span[".mdc-button__label"]("Button")
  )
);
