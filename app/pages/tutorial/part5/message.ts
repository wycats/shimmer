import type { IntoContent, Invoke } from "@shimmer/core";
import { defDSL, fragment } from "@shimmer/dsl";
import type { Block } from "@shimmer/reactive";
import { computed, Reactive } from "@shimmer/reactive";
import { el, If } from "../../utils";
import Avatar from "./avatar";
import Username from "./username";

function substring(
  string: Reactive<string>,
  start: Reactive<number>,
  end: Reactive<number>
): Reactive<string> {
  return computed(() => string.now.substring(start.now, end.now));
}

export default defDSL(
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
          title: computed(() => `${username.now}'s avatar`),
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
