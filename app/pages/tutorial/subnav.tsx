import { def, defDSL, element, fragment } from "@shimmer/dsl";
import { Reactive } from "@shimmer/reactive";
import { SimpleLink, SimpleLinkTo } from "../nav";

export const SubNav = defDSL(({ $ }) => {
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

export const SubNavBar = def(() => (
  <nav>
    <SimpleLinkTo href="#tutorial?part=1">Part 1</SimpleLinkTo>
    <SimpleLinkTo href="#tutorial?part=2">Part 2</SimpleLinkTo>
    <SimpleLinkTo href="#tutorial?part=3">Part 3</SimpleLinkTo>
    <SimpleLinkTo href="#tutorial?part=4">Part 4</SimpleLinkTo>
    <SimpleLinkTo href="#tutorial?part=5">Part 5</SimpleLinkTo>
  </nav>
));
