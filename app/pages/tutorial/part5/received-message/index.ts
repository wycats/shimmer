import { component, Owner, text } from "../../../../../src/index";
import { el } from "../../../utils";
import Message from "../message";

export default component((owner: Owner) => () =>
  Message(owner)({
    args: {
      username: "Tomster",
      userIsActive: true,
      userLocalTime: "4:56pm",
      // avatarTitle: "Tomster's avatar",
      // avatarInitial: "T",
      isCurrentUser: false,
    },
    blocks: {
      default: el(
        "p",
        text("Hey Zoey, have you had a chance to look at the EmberConf"),
        text("brainstorming doc I sent you?")
      ),
    },
  })
);
