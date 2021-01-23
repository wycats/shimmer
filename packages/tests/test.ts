import {
  createAttr,
  createElement,
  createMatch,
  createText,
} from "@shimmer/core";
import { Cell, Choice, Reactive, Variants } from "@shimmer/reactive";
import { main, test } from "./context";
import { DOMReporter } from "./ui";

test("it can render text", async (ctx) => {
  let body = Cell.of("hello");

  ctx.render(createText(body), () => ctx.assert("hello"));

  ctx.step("updating cell");

  await ctx.update(
    () => body.update(() => "goodbye"),
    () => ctx.assert("goodbye")
  );
});

test("a simple element", async (ctx) => {
  let el = createElement({ tag: "div", modifiers: null, body: null });

  ctx.render(el, () => ctx.assert("<div></div>"));
});

test("an element with attributes", async (ctx) => {
  let title = Cell.of("Tom");

  let el = createElement({
    tag: "div",
    modifiers: [createAttr("title", title)],
    body: null,
  });

  ctx.render(el, () => ctx.assert(`<div title="Tom"></div>`));

  await ctx.update(
    () => title.update(() => "Thomas"),
    () => ctx.assert(`<div title="Thomas"></div>`)
  );
});

test("an element with classes", async (ctx) => {
  let classA = Cell.of("classa");
  let classB = Cell.of("classb");

  let el = createElement({
    tag: "div",
    modifiers: [createAttr("class", classA), createAttr("class", classB)],
    body: null,
  });

  ctx.render(el, () => ctx.assert(`<div class="classa classb"></div>`));

  await ctx.update(
    () => classA.update(() => "CLASSA"),
    () => ctx.assert(`<div class="CLASSA classb"></div>`)
  );

  await ctx.update(
    () => classB.update(() => "CLASSB"),
    () => ctx.assert(`<div class="CLASSA CLASSB"></div>`)
  );

  await ctx.update(
    () => {
      classA.update(() => "classa");
      classB.update(() => "classb");
    },
    () => ctx.assert(`<div class="classa classb"></div>`)
  );
});

test("an element with a body", async (ctx) => {
  let body = Cell.of("hello");

  let el = createElement({
    tag: "div",
    modifiers: null,
    body: createText(body),
  });

  ctx.inur(el, `<div>hello</div>`, {
    desc: "update cell",
    update: () => body.update(() => "goodbye"),
    expect: `<div>goodbye</div>`,
  });
});

test("a simple choice", async (ctx) => {
  type Bool = {
    true: Choice<"true">;
    false: Choice<"false">;
  };

  const Bool = Variants.define<Bool>();

  let bool = Bool.cell("true");

  let cond = createMatch(bool, {
    true: () => createText(Reactive.static("true")),
    false: () => createText(Reactive.static("false")),
  });

  return ctx.inur(
    cond,
    "true",
    {
      desc: "update cell",
      update: () => bool.update(() => ({ discriminant: "false" })),
      expect: "false",
    },
    {
      desc: "reset cell",
      update: () => {
        bool.update(() => ({ discriminant: "true" }));
      },
      expect: "true",
    }
  );
});

test("a choice with values", async (ctx) => {
  type Option = {
    some: Choice<"some", string>;
    none: Choice<"none">;
  };

  const Option = Variants.define<Option>();

  let tom = Cell.of("Tom");
  let tom2 = Cell.of("Tom");

  let person = Option.cell("some", tom);

  let match = createMatch(person, {
    some: ([person]) => createText(person),
    none: () => createText(Reactive.static("no person")),
  });

  return ctx.inur(
    match,
    "Tom",
    {
      desc: "update cell",
      update: () => person.update(() => Option.next("none")),
      expect: "no person",
    },
    {
      desc: "reset cell",
      update: () => person.update(() => Option.next("some", tom2)),
      expect: "Tom",
    },
    {
      desc: "update inner cell",
      update: () => tom2.update(() => "Thomas"),
      expect: "Thomas",
    },
    {
      desc: "reset to original cell",
      update: () => person.update(() => Option.next("some", tom)),
      expect: "Tom",
    },
    {
      desc: "reset to fresh cell",
      update: () => person.update(() => Option.next("some", Cell.of("Tom"))),
      expect: "Tom",
    }
  );
});

main(DOMReporter);
