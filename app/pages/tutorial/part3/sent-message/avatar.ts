import { def } from "@shimmer/dsl";
import Avatar from "../avatar";

export default def(({ $ }) =>
  $(Avatar, {
    args: {
      title: "Zoey's avatar",
      initial: "Z",
      isActive: false,
    },
    attrs: { class: "current-user" },
  })
);
