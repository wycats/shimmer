import { def, fragment } from "../../../../../src/index";
import { el } from "../../../utils";
import ReceivedMessageAvatar from "./avatar";
import ReceivedMessageUsername from "./username";

export default def(({ $ }) =>
  fragment(
    $(ReceivedMessageAvatar),
    el(
      "section",
      $(ReceivedMessageUsername),
      el(
        "p",
        "Hey Zoey, have you had a chance to look at the EmberConf brainstorming doc I sent you?"
      )
    )
  )
);
