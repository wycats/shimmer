import {
  component,
  ComponentData,
  fragment,
  IntoContent,
  Owner,
  Reactive,
} from "../../../../src/index";
import type { Block } from "../../../../src/nodes/structure/block";
import { el, If } from "../../utils";
import Avatar from "./avatar";
import Username from "./username";

interface MessageArgs extends ComponentData {
  args: {
    avatarTitle: Reactive<string>;
    avatarInitial: Reactive<string>;
    userIsActive: Reactive<boolean>;
    isCurrentUser: Reactive<boolean>;
    username: Reactive<string>;
    userLocalTime: Reactive<string>;
  };
  blocks: { default: Block<[]> };
}

export default component<Owner, MessageArgs>(
  (owner: Owner) => ({
    args: {
      avatarTitle,
      avatarInitial,
      userIsActive,
      isCurrentUser,
      username,
      userLocalTime,
    },
    blocks: { default: body },
  }: MessageArgs): IntoContent => {
    return fragment(
      Avatar(owner)({
        args: {
          title: avatarTitle,
          initial: avatarInitial,
          isActive: userIsActive,
        },
        attrs: { class: If(isCurrentUser, "current-user", null) },
      }),
      el(
        "section",
        Username(owner)({
          args: { name: username, localTime: userLocalTime },
        }),
        body.invoke([])
      )
    );
  }
);
