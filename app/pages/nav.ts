import {
  component,
  Dict,
  element,
  fragment,
  Owner,
  Pure,
  Reactive,
  RouterService,
  text,
} from "../../src/index";
import { el } from "./utils";

export function isActive(
  href: Reactive<string>,
  owner: Owner
): Reactive<boolean> {
  let router = owner.service("router");

  return Pure.of(() => {
    let current = router.normalizeHref(href.now);

    if (current === "/fallback") {
      return inFallback(router);
    } else {
      return router.isActive(current);
    }
  });
}

export function inFallback(router: RouterService): boolean {
  return !(
    router.isActive("/tutorial") ||
    router.isActive("/index") ||
    router.isActive("/state")
  );
}

export const SimpleLink = component((_owner: Owner) => {
  return (args: Dict<{ href: Reactive<string> }>, body: Reactive<string>) => {
    let { href } = args.now;

    return el("a", { href }, text(body));
  };
});

export const Link = component((owner: Owner) => {
  return (args: Dict<{ href: Reactive<string> }>, body: Reactive<string>) => {
    let { href } = args.now;

    let active = isActive(href, owner);

    let activeClass = Pure.of(() => (active.now ? "active-url" : null));

    return el("a", { href, class: activeClass }, text(body));
  };
});

export const Nav = component((owner: Owner) => () => {
  return element(
    "nav",
    fragment(
      Link(owner)({ href: Reactive.static("#tutorial") }, "Tutorial"),
      Link(owner)({ href: Reactive.static("#index") }, "Counts"),
      Link(owner)({ href: Reactive.static("#state") }, "State"),
      Link(owner)({ href: Reactive.static("#fallback") }, "Fallback")
    )
  );
});
