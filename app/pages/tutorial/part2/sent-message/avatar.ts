import { defDSL, html } from "@shimmer/dsl";

export default defDSL(() =>
  html.aside[".current-user"](
    html.div[".avatar"].attr("title", "Zoey's avatar")("Z")
  )
);
