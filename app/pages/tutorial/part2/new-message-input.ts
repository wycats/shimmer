import { defDSL, html } from "@shimmer/dsl";

export default defDSL(() =>
  html.form(html.input(), html.button.attr("type", "submit")("Send"))
);
