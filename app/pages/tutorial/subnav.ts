import {
  component,
  element,
  fragment,
  Owner,
  Reactive,
} from "../../../src/index";
import { SimpleLink } from "../nav";

export const SubNav = component((owner: Owner) => () => {
  return element(
    "nav",
    fragment(
      SimpleLink(owner)({
        args: { href: Reactive.static("#tutorial?part=1") },
        blocks: { default: "Part 1" },
      }),
      SimpleLink(owner)({
        args: { href: Reactive.static("#tutorial?part=2") },
        blocks: { default: "Part 2" },
      }),
      SimpleLink(owner)({
        args: { href: Reactive.static("#tutorial?part=3") },
        blocks: { default: "Part 3" },
      }),
      SimpleLink(owner)({
        args: { href: Reactive.static("#tutorial?part=4") },
        blocks: { default: "Part 4" },
      }),
      SimpleLink(owner)({
        args: { href: Reactive.static("#tutorial?part=5") },
        blocks: { default: "Part 5" },
      })
    )
  );
});
