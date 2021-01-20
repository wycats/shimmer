import { def, html } from "@shimmer/dsl";

export default def(() =>
  html.h4[".username"](
    "Tomster",
    html.span[".local-time"]("their local time is 4:56pm")
  )
);
