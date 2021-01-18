import { component, fragment, text } from "../../../../../src/index";
import { el } from "../../../utils";
import ReceivedMessageAvatar from "./avatar";
import ReceivedMessageUsername from "./username";

export default component(({ $ }) =>
  fragment(
    $(ReceivedMessageAvatar),
    el(
      "section",
      $(ReceivedMessageUsername),
      el(
        "p",
        text(
          "Hey Zoey, have you had a chance to look at the EmberConf brainstorming doc I sent you?"
        )
      )
    )
  )
);
