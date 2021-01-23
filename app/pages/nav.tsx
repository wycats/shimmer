import { Content, getCurrentRealm, Invoke, RouterService } from "@shimmer/core";
import { def, defDSL, element, fragment, text } from "@shimmer/dsl";
import { Block, computed, Reactive } from "@shimmer/reactive";
import { el } from "./utils";

export function isActive(
  href: Reactive<string>,
  router: RouterService
): Reactive<boolean> {
  return computed(() => {
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
    router.isActive("/material") ||
    router.isActive("/index") ||
    router.isActive("/state")
  );
}

export const SimpleLinkTo = def<
  { href: Reactive<string> },
  { default: Block<[]> }
>(
  (
    { href }: { href: Reactive<string> },
    { default: body }: { default: Block<[]> }
  ) => <a href={href}>{body([])}</a>
);

export const SimpleLink = defDSL(
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

export const LinkTo = def(
  (
    { href }: { href: Reactive<string> },
    { default: body }: { default: Block<[]> }
  ) => {
    let router = getCurrentRealm().service("router");
    let active = isActive(href, router);

    let activeClass = computed(() => (active.now ? "active-url" : null));

    return (
      <a href={href} class={activeClass}>
        {body.invoke([])}
      </a>
    );
  }
);

export const Link = defDSL(
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

    let activeClass = computed(() => (active.now ? "active-url" : null));

    return el("a", { href, class: activeClass }, body.invoke([]));
  }
);

export const NavBar = def(() => (
  <nav>
    <LinkTo href="#tutorial">Tutorial</LinkTo>
    <LinkTo href="#material">Material</LinkTo>
    <LinkTo href="#index">Index</LinkTo>
    <LinkTo href="#state">State</LinkTo>
    <LinkTo href="#fallback">Fallback</LinkTo>
  </nav>
));

export const Nav = defDSL(({ $ }) => {
  return element(
    "nav",
    fragment(
      $(Link, {
        args: { href: Reactive.static("#tutorial") },
        blocks: { default: () => text("Tutorial") },
      }),
      $(Link, {
        args: { href: Reactive.static("#material") },
        blocks: { default: () => text("Material") },
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
