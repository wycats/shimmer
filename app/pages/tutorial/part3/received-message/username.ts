import { component, Owner } from "../../../../../src/index";
import Username from "../username";

export default component((owner: Owner) => () =>
  Username(owner)({ name: "Tomster", localTime: "4:56pm" })
);
