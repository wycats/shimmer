import { component, element, fragment, Owner } from "../../../src/index";
import { SimpleLink } from "../nav";

export const SubNav = component((owner: Owner) => () => {
  return element(
    "nav",
    fragment(
      SimpleLink(owner)({ href: "#tutorial?part=1" }, "Part 1"),
      SimpleLink(owner)({ href: "#tutorial?part=2" }, "Part 2"),
      SimpleLink(owner)({ href: "#tutorial?part=3" }, "Part 3"),
      SimpleLink(owner)({ href: "#tutorial?part=4" }, "Part 4"),
      SimpleLink(owner)({ href: "#tutorial?part=5" }, "Part 5")
    )
  );
});
