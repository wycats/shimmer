import type { Block, IntoContent, Invoke } from "@shimmer/core";
import { def, fragment } from "@shimmer/dsl";
import { Pure, Reactive } from "@shimmer/reactive";
import { el, If } from "../../utils";
import Avatar from "./avatar";
import Username from "./username";

function substring(
  string: Reactive<string>,
  start: Reactive<number>,
  end: Reactive<number>
): Reactive<string> {
  return Pure.of(() => string.now.substring(start.now, end.now));
}

export default def(
  ({
    $,
    args: { userIsActive, isCurrentUser, username, userLocalTime },
    blocks: { default: body },
  }: {
    $: Invoke;
    args: {
      userIsActive: Reactive<boolean>;
      isCurrentUser: Reactive<boolean>;
      username: Reactive<string>;
      userLocalTime: Reactive<string | undefined>;
    };
    blocks: { default: Block<[]> };
  }): IntoContent => {
    return fragment(
      $(Avatar, {
        args: {
          title: Pure.of(() => `${username.now}'s avatar`),
          initial: substring(username, Reactive.static(0), Reactive.static(1)),
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
