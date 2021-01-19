import { def } from "../../../../../src/index";
import Avatar from "../avatar";

export default def(({ $ }) =>
  $(Avatar, {
    args: {
      title: "Tomster's avatar",
      initial: "T",
      isActive: true,
    },
  })
);
