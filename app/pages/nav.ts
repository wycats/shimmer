import type { Block } from "@shimmer/core";
import { Content, Invoke, Pure, Reactive, RouterService } from "@shimmer/core";
import { def, element, fragment, text } from "@shimmer/dsl";
import { el } from "./utils";

export function isActive(
  href: Reactive<string>,
  router: RouterService
): Reactive<boolean> {
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

export const SimpleLink = def(
  ({
    args: { href },
    blocks: { default: body },
  }: {
    args: { href: Reactive<string> };
    blocks: { default: Block<[]> };
  }): Content => {
    return el("a", { href }, body.invoke([]));
  }
);

export const Link = def(
  ({
    $,
    args: { href },
    blocks: { default: body },
  }: {
    $: Invoke;
    args: { href: Reactive<string> };
    blocks: { default: Block<[]> };
  }) => {
    let active = isActive(href, $.service("router"));

    let activeClass = Pure.of(() => (active.now ? "active-url" : null));

    return el("a", { href, class: activeClass }, body.invoke([]));
  }
);

export const Nav = def(({ $ }) => {
  return element(
    "nav",
    fragment(
      $(Link, {
        args: { href: Reactive.static("#tutorial") },
        blocks: { default: () => text("Tutorial") },
      }),
      $(Link, {
        args: { href: Reactive.static("#index") },
        blocks: { default: () => "Counts" },
      }),
      $(Link, {
        args: { href: Reactive.static("#state") },
        blocks: { default: () => "State" },
      }),
      $(Link, {
        args: { href: Reactive.static("#fallback") },
        blocks: { default: () => "Fallback" },
      })
    )
  );
});
