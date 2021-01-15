import {
  component,
  Dict,
  fragment,
  Owner,
  Reactive,
} from "../../../../src/index";
import type { Block } from "../../../../src/nodes/structure/block";
import { el, If } from "../../utils";
import Avatar from "./avatar";
import Username from "./username";

export default component(
  (owner: Owner) => (
    {
      avatarTitle,
      avatarInitial,
      userIsActive,
      isCurrentUser,
      username,
      userLocalTime,
    }: Dict<{
      avatarTitle: Reactive<string>;
      avatarInitial: Reactive<string>;
      userIsActive: Reactive<boolean>;
      isCurrentUser: Reactive<boolean>;
      username: Reactive<string>;
      userLocalTime: Reactive<string>;
    }>,
    body: Block<void>
  ) =>
    fragment(
      Avatar(owner)(
        { title: avatarTitle, initial: avatarInitial, isActive: userIsActive },
        { class: If(isCurrentUser, "current-user", null) }
      ),
      el(
        "section",
        Username(owner)({ name: username, localTime: userLocalTime }),
        body.invoke(Reactive.static(undefined))
      )
    )
);
