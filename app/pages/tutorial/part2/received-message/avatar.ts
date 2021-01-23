import { defDSL, html } from "@shimmer/dsl";

export default defDSL(() =>
  html.aside(
    html.div[".avatar.is-active"].attr("title", "Tomster's avatar")("T")
  )
);
