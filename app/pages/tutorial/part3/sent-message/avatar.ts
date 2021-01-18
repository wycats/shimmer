import { component } from "../../../../../src/index";
import Avatar from "../avatar";

export default component(({ $ }) =>
  $(Avatar, {
    args: {
      title: "Zoey's avatar",
      initial: "Z",
      isActive: false,
    },
    attrs: { class: "current-user" },
  })
);
