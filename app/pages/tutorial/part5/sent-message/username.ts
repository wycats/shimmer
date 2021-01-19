import { def } from "../../../../../src/index";
import Username from "../username";

export default def(({ $ }) =>
  $(Username, {
    args: {
      name: "Zoey",
      localTime: undefined,
    },
  })
);
