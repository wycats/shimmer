import { def, html } from "@shimmer/dsl";

export default def(() =>
  html.aside(
    html.div[".avatar.is-active"].attr("title", "Tomster's avatar")("T")
  )
);
