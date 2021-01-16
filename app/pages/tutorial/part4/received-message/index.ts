import {
  component,
  Dict,
  Owner,
  Reactive,
  text,
} from "../../../../../src/index";
import { createBlock } from "../../../../../src/nodes/structure/block";
import { el } from "../../../utils";
import Message from "../message";

export default component((owner: Owner) => () =>
  Message(owner)(
    Dict.of({
      username: Reactive.static("Tomster"),
      userIsActive: Reactive.static(true),
      userLocalTime: Reactive.static("4:56pm"),
      avatarTitle: Reactive.static("Tomster's avatar"),
      avatarInitial: Reactive.static("T"),
      isCurrentUser: Reactive.static(false),
    }),
    createBlock(() => {
      return el(
        "p",
        text("Hey Zoey, have you had a chance to look at the EmberConf"),
        text("brainstorming doc I sent you?")
      );
    })
  )
);
