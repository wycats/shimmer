import { def } from "@shimmer/dsl";
import Username from "../username";

export default def(({ $ }) =>
  $(Username, {
    args: {
      name: "Zoey",
      localTime: undefined,
    },
  })
);
