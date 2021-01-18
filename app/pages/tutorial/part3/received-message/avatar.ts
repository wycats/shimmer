import { component, Owner, Reactive } from "../../../../../src/index";
import Avatar from "../avatar";

export default component((owner: Owner) => () =>
  Avatar(owner)({
    args: {
      title: Reactive.static("Tomster's avatar"),
      initial: Reactive.static("T"),
      isActive: Reactive.static(true),
    },
  })
);
