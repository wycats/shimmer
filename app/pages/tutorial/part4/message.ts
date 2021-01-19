import type {
  Block,
  Invoke,
  PresentComponentDefinition,
  Reactive,
  Services,
} from "@shimmer/core";
import { def, fragment } from "@shimmer/dsl";
import { el, If } from "../../utils";
import Avatar from "./avatar";
import Username from "./username";

interface MessageArgs extends PresentComponentDefinition {
  $: Invoke<Services>;
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

export default def(
  ({
    $,
    args: {
      avatarTitle,
      avatarInitial,
      userIsActive,
      isCurrentUser,
      username,
      userLocalTime,
    },
    blocks: { default: body },
  }: MessageArgs) => {
    return fragment(
      $(Avatar, {
        args: {
          title: avatarTitle,
          initial: avatarInitial,
          isActive: userIsActive,
        },
        attrs: { class: If(isCurrentUser, "current-user", null) },
      }),
      el(
        "section",
        $(Username, {
          args: { name: username, localTime: userLocalTime },
        }),
        body.invoke([])
      )
    );
  }
);
