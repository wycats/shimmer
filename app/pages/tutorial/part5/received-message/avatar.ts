import { component, Owner } from "../../../../../src/index";
import Avatar from "../avatar";

export default component((owner: Owner) => () =>
  Avatar(owner)({
    args: {
      title: "Tomster's avatar",
      initial: "T",
      isActive: true,
    },
  })
);
