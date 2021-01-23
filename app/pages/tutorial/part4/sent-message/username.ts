import { defDSL } from "@shimmer/dsl";
import Username from "../username";

export default defDSL(({ $ }) =>
  $(Username, {
    args: {
      name: "Zoey",
      localTime: undefined,
    },
  })
);
