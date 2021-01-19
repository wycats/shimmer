import { def } from "@shimmer/dsl";
import Username from "../username";

export default def(({ $ }) =>
  $(Username, {
    args: {
      name: "Tomster",
      localTime: "4:56pm",
    },
  })
);
