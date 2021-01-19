import { def } from "../../../../../src/index";
import Username from "../username";

export default def(({ $ }) =>
  $(Username, {
    args: {
      name: "Tomster",
      localTime: "4:56pm",
    },
  })
);
