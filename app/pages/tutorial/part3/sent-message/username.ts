import { component, Dict, Owner, Reactive } from "../../../../../src/index";
import Username from "../username";

export default component((owner: Owner) => () =>
  Username(owner)(
    Dict.of({
      name: Reactive.static("Zoey"),
      localTime: Reactive.static(undefined),
    })
  )
);
