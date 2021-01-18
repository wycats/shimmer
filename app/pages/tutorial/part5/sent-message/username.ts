import { component, Owner } from "../../../../../src/index";
import Username from "../username";

export default component((owner: Owner) => () =>
  Username(owner)({
    args: {
      name: "Zoey",
      localTime: undefined,
    },
  })
);
