import { def, element, fragment } from "@shimmer/dsl";
import { Reactive } from "@shimmer/reactive";
import { SimpleLink } from "../nav";

export const SubNav = def(({ $ }) => {
  return element(
    "nav",
    fragment(
      $(SimpleLink, {
        args: { href: Reactive.static("#tutorial?part=1") },
        blocks: { default: "Part 1" },
      }),
      $(SimpleLink, {
        args: { href: Reactive.static("#tutorial?part=2") },
        blocks: { default: "Part 2" },
      }),
      $(SimpleLink, {
        args: { href: Reactive.static("#tutorial?part=3") },
        blocks: { default: "Part 3" },
      }),
      $(SimpleLink, {
        args: { href: Reactive.static("#tutorial?part=4") },
        blocks: { default: "Part 4" },
      }),
      $(SimpleLink, {
        args: { href: Reactive.static("#tutorial?part=5") },
        blocks: { default: "Part 5" },
      })
    )
  );
});
