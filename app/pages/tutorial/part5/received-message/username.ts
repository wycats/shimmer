import { component } from "../../../../../src/index";
import Username from "../username";

export default component(({ $ }) =>
  $(Username, {
    args: {
      name: "Tomster",
      localTime: "4:56pm",
    },
  })
);
