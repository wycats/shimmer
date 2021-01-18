import { component, Reactive } from "../../../../../src/index";
import Avatar from "../avatar";

export default component(({ $ }) =>
  $(Avatar, {
    args: {
      title: Reactive.static("Tomster's avatar"),
      initial: Reactive.static("T"),
      isActive: Reactive.static(true),
    },
  })
);
