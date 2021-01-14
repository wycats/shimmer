import {
  attr,
  component,
  element,
  fragment,
  Owner,
  Pure,
  Reactive,
  text,
} from "../../src/index";

const Link = component((owner: Owner) => {
  let router = owner.service("router");

  return (href: Reactive<string>, body: Reactive<string>) => {
    let isActive = Pure.of(() =>
      router.isActive(router.normalizeHref(href.now)) ? "active-url" : null
    );

    return element(
      "a",
      [attr("href", href), attr("class", isActive)],
      text(body)
    );
  };
});

export const Nav = component((owner: Owner) => () => {
  return element(
    "nav",
    fragment(
      Link(owner)("#tutorial", "Tutorial"),
      Link(owner)("#index", "Counts")
    )
  );
});
