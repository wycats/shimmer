import { defDSL } from "@shimmer/dsl";
import Avatar from "../avatar";

export default defDSL(({ $ }) =>
  $(Avatar, {
    args: {
      title: "Tomster's avatar",
      initial: "T",
      isActive: true,
    },
  })
);
