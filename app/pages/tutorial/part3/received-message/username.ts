import { component, Reactive } from "../../../../../src/index";
import Username from "../username";

export default component(({ $ }) =>
  $(Username, {
    args: {
      name: Reactive.static("Tomster"),
      localTime: Reactive.static("4:56pm"),
    },
  })
);
