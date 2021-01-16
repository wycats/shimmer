import { component, Dict, Owner, Reactive } from "../../../../../src/index";
import Avatar from "../avatar";

export default component((owner: Owner) => () =>
  Avatar(owner)(
    Dict.of({
      title: Reactive.static("Zoey's avatar"),
      initial: Reactive.static("Z"),
      isActive: Reactive.static(false),
    }),
    { class: "current-user" }
  )
);
