import { createAttr, createElement, createText } from "@shimmer/core";
import { Cell, Reactive } from "@shimmer/reactive";
import { module } from "../context";

module("element rendering", (test) => {
  test("merged class (static)", async (ctx) => {
    let el = createElement({
      tag: "div",
      modifiers: [
        createAttr("class", Reactive.static("first")),
        createAttr("class", Reactive.static("second")),
      ],
      body: createText(Reactive.static("hello world")),
    });

    await ctx.render(el, () => {
      ctx.assertHTML(`<div class="first second">hello world</div>`);
    });
  });

  test("merged class (dynamic)", async (ctx) => {
    let first = Cell.of("first");
    let body = Cell.of("hello world");

    let el = createElement({
      tag: "div",
      modifiers: [
        createAttr("class", first),
        createAttr("class", Reactive.static("second")),
      ],
      body: createText(body),
    });

    return ctx.inur(
      el,
      `<div class="first second">hello world</div>`,
      {
        desc: "update class cell",
        update: () => first.update(() => "FIRST"),
        expect: `<div class="FIRST second">hello world</div>`,
      },
      {
        desc: "update body cell",
        update: () => body.update(() => "goodbye world"),
        expect: `<div class="FIRST second">goodbye world</div>`,
      },
      {
        desc: "reset class cell",
        update: () => first.update(() => "first"),
        expect: `<div class="first second">goodbye world</div>`,
      },
      {
        desc: "reset body cell",
        update: () => body.update(() => "hello world"),
        expect: `<div class="first second">hello world</div>`,
      }
    );
  });

  test("merged aria-describedby (dynamic)", async (ctx) => {
    let desc1 = Cell.of("desc1");
    let desc2 = Cell.of("desc2");
    let body = Cell.of("hello world");

    let el = createElement({
      tag: "div",
      modifiers: [
        createAttr("aria-describedby", desc1),
        createAttr("aria-describedby", desc2),
      ],
      body: createText(body),
    });

    return ctx.inur(
      el,
      `<div aria-describedby="desc1 desc2">hello world</div>`,
      {
        desc: "update aria-describedby cell",
        update: () => desc1.update(() => "desc1a"),
        expect: `<div aria-describedby="desc1a desc2">hello world</div>`,
      },
      {
        desc: "update body cell",
        update: () => body.update(() => "goodbye world"),
        expect: `<div aria-describedby="desc1a desc2">goodbye world</div>`,
      },
      {
        desc: "update second aria-describedby cell",
        update: () => desc2.update(() => "desc2a"),
        expect: `<div aria-describedby="desc1a desc2a">goodbye world</div>`,
      },
      {
        desc: "reset aria-describedby cell",
        update: () => desc1.update(() => "desc1"),
        expect: `<div aria-describedby="desc1 desc2a">goodbye world</div>`,
      },
      {
        desc: "reset body cell",
        update: () => body.update(() => "hello world"),
        expect: `<div aria-describedby="desc1 desc2a">hello world</div>`,
      },
      {
        desc: "reset second aria-describedby cell",
        update: () => desc2.update(() => "desc2"),
        expect: `<div aria-describedby="desc1 desc2">hello world</div>`,
      }
    );
  });
});
