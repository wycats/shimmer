import { def } from "../../../../../src/index";
import { el } from "../../../utils";
import Message from "../message";

export default def(({ $ }) =>
  $(Message, {
    args: {
      username: "Tomster",
      userIsActive: true,
      userLocalTime: "4:56pm",
      avatarTitle: "Tomster's avatar",
      avatarInitial: "T",
      isCurrentUser: false,
    },
    blocks: {
      default: el(
        "p",
        "Hey Zoey, have you had a chance to look at the EmberConf",
        "brainstorming doc I sent you?"
      ),
    },
  })
);
