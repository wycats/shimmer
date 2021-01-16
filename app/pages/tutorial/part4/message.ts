import {
  component,
  Dict,
  fragment,
  IntoContent,
  Owner,
  Reactive,
  Static,
} from "../../../../src/index";
import type { Block } from "../../../../src/nodes/structure/block";
import { el, If } from "../../utils";
import Avatar from "./avatar";
import Username from "./username";

export default component(
  (owner: Owner) => (
    args: Dict<{
      avatarTitle: Reactive<string>;
      avatarInitial: Reactive<string>;
      userIsActive: Reactive<boolean>;
      isCurrentUser: Reactive<boolean>;
      username: Reactive<string>;
      userLocalTime: Reactive<string>;
    }>,
    body: Static<Block<[]>>
  ): IntoContent => {
    let {
      avatarTitle,
      avatarInitial,
      userIsActive,
      isCurrentUser,
      username,
      userLocalTime,
    } = args.now;

    return fragment(
      Avatar(owner)(
        Dict.of({
          title: avatarTitle,
          initial: avatarInitial,
          isActive: userIsActive,
        }),
        { class: If(isCurrentUser, "current-user", null) }
      ),
      el(
        "section",
        Username(owner)(Dict.of({ name: username, localTime: userLocalTime })),
        body.now.invoke([])
      )
    );
    throw new Error("unimplemented");
  }
);
