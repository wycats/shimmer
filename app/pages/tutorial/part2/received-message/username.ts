import { defDSL, html } from "@shimmer/dsl";

export default defDSL(() =>
  html.h4[".username"](
    "Tomster",
    html.span[".local-time"]("their local time is 4:56pm")
  )
);
