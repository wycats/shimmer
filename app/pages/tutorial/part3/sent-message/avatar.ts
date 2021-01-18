import { component, Owner, Reactive } from "../../../../../src/index";
import Avatar from "../avatar";

export default component((owner: Owner) => () =>
  Avatar(owner)({
    args: {
      title: Reactive.static("Zoey's avatar"),
      initial: Reactive.static("Z"),
      isActive: Reactive.static(false),
    },
    attrs: { class: "current-user" },
  })
);
