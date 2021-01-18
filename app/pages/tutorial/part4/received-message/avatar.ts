import { component } from "../../../../../src/index";
import Avatar from "../avatar";

export default component(({ $ }) =>
  $(Avatar, {
    args: {
      title: "Tomster's avatar",
      initial: "T",
      isActive: true,
    },
  })
);
