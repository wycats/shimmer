import { component, fragment, Owner, text } from "../../../../../src/index";
import { el } from "../../../utils";
import ReceivedMessageAvatar from "./avatar";
import ReceivedMessageUsername from "./username";

export default component((owner: Owner) => () =>
  fragment(
    ReceivedMessageAvatar(owner)(),
    el(
      "section",
      ReceivedMessageUsername(owner)(),
      el(
        "p",
        text(
          "Hey Zoey, have you had a chance to look at the EmberConf brainstorming doc I sent you?"
        )
      )
    )
  )
);
