import { component, Dict, Owner, Reactive } from "../../../../../src/index";
import Avatar from "../avatar";

export default component((owner: Owner) => () =>
  Avatar(owner)(
    Dict.of({
      title: Reactive.static("Tomster's avatar"),
      initial: Reactive.static("T"),
      isActive: Reactive.static(true),
    }),
    {}
  )
);
