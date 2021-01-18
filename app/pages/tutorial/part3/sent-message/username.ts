import { component } from "../../../../../src/index";
import Username from "../username";

export default component(({ $ }) =>
  $(Username, {
    // args: {
    //   name: Reactive.static("Zoey"),
    //   localTime: Reactive.static(undefined),
    // },
  })
);
