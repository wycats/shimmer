import { component, Owner } from "../../../../../src/index";
import Avatar from "../avatar";

export default component((owner: Owner) => () =>
  Avatar(owner)({
    args: {
      title: "Zoey's avatar",
      initial: "Z",
      isActive: false,
    },
    attrs: { class: "current-user" },
  })
);
