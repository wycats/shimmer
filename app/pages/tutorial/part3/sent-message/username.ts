import { component, Owner, Reactive } from "../../../../../src/index";
import Username from "../username";

export default component((owner: Owner) => () =>
  Username(owner)({
    args: {
      name: Reactive.static("Zoey"),
      localTime: Reactive.static(undefined),
    },
  })
);
