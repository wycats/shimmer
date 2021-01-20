import { def, html } from "@shimmer/dsl";

export default def(() =>
  html.form(html.input(), html.button.attr("type", "submit")("Send"))
);
