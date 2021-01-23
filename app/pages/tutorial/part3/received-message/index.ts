import { defDSL, fragment, html } from "@shimmer/dsl";
import ReceivedMessageAvatar from "./avatar";
import ReceivedMessageUsername from "./username";

export default defDSL(({ $ }) =>
  fragment(
    $(ReceivedMessageAvatar),
    html.section(
      $(ReceivedMessageUsername),
      html.p(
        "Hey Zoey, have you had a chance to look at the EmberConf brainstorming doc I sent you?"
      )
    )
  )
);
