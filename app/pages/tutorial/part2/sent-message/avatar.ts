import { def, html } from "@shimmer/dsl";

export default def(() =>
  html.aside[".current-user"](
    html.div[".avatar"].attr("title", "Zoey's avatar")("Z")
  )
);
