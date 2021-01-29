import {
  Args,
  createAttr,
  createElement,
  createFragment,
  createText,
  EffectModifier,
  Modifier,
  RenderDetails,
} from "@shimmer/core";
import {
  Cell,
  ClosedFunction,
  Reactive,
  StaticReactive,
} from "@shimmer/reactive";
import { module } from "../context";
import { ElementRef, on } from "./utils";

module("integration: counter", (test) => {
  test("basic rendering", async (ctx) => {
    await render(async (options) => {
      ctx.step(options.static ? "static args" : "dynamic args");
      ctx.clear();
      let component = () => Component(options);

      let { content } = await ctx.render(component, () => {
        ctx.assertHTML(
          `<p>0</p><p>× 1</p><p>= 0</p><button>+1</button><button>-1</button><button type="button">Double It</button>`
        );
      });

      ctx.assert(
        content.isStatic === options.static,
        `the component is ${options.static ? "static" : "dynamic"}`
      );
    });
  });

  test("clicking a button", async (ctx) => {
    let component = () => Component({ static: false });

    let {
      content,
      details: { plus, minus, double },
    } = await ctx.render(component, () => {
      ctx.assertHTML(
        `<p>0</p><p>× 1</p><p>= 0</p><button>+1</button><button>-1</button><button type="button">Double It</button>`
      );
    });

    ctx.assert(content.isStatic === false, `the component is dynamic`);
    await ctx.fire(plus.element, "click", new MouseEvent("click"));

    ctx.assertHTML(
      `<p>1</p><p>× 1</p><p>${"="} 1</p><button>+1</button><button>-1</button><button type="button">Double It</button>`
    );

    await ctx.fire(double.element, "click", new MouseEvent("click"));
    ctx.assertHTML(
      `<p>1</p><p>× 2</p><p>${"="} 2</p><button>+1</button><button>-1</button><button type="button">Double It</button>`
    );

    await ctx.fire(plus.element, "click", new MouseEvent("click"));
    ctx.assertHTML(
      `<p>2</p><p>× 2</p><p>${"="} 4</p><button>+1</button><button>-1</button><button type="button">Double It</button>`
    );

    await ctx.fire(minus.element, "click", new MouseEvent("click"));
    ctx.assertHTML(
      `<p>1</p><p>× 2</p><p>${"="} 2</p><button>+1</button><button>-1</button><button type="button">Double It</button>`
    );

    await ctx.fire(minus.element, "click", new MouseEvent("click"));
    ctx.assertHTML(
      `<p>0</p><p>× 2</p><p>${"="} 0</p><button>+1</button><button>-1</button><button type="button">Double It</button>`
    );
  });
});

interface Options {
  static: boolean;
}

async function render(
  render: (options: { static: boolean }) => Promise<void>
): Promise<void> {
  await render({ static: true });
  await render({ static: false });
}

interface TestRefs {
  plus: ElementRef;
  minus: ElementRef;
  double: ElementRef;
}

const Component = (options: Options): RenderDetails<TestRefs> => {
  let multiple = reactive(1, options);

  return Counter(options)({
    multiple: multiple,
  });
};

const Counter = (options: Options) => ({
  multiple,
}: {
  multiple: DependsReactive<number>;
}): RenderDetails<TestRefs> => {
  let count = reactive(0, options);

  let total = ClosedFunction.of<
    { count: Reactive<number>; multiple: Reactive<number> },
    number
  >(({ count, multiple }) => count * multiple)({
    count: count.cell,
    multiple: multiple.cell,
  });

  let plus = ElementRef.of("plus");
  let minus = ElementRef.of("minus");
  let double = ElementRef.of("double");

  return {
    details: { plus: plus.ref, minus: minus.ref, double: double.ref },
    content: createFragment([
      createElement({
        tag: "p",
        modifiers: [],
        body: createText(ToString({ value: count.cell })),
      }),
      createElement({
        tag: "p",
        modifiers: [],
        body: createFragment([
          createText(s("× ")),
          createText(ToString({ value: multiple.cell })),
        ]),
      }),
      createElement({
        tag: "p",
        modifiers: [],
        body: createFragment([
          createText(s("= ")),
          createText(ToString({ value: total })),
        ]),
      }),
      createElement({
        tag: "button",
        modifiers: modifiers(
          plus.modifier,
          updateCell(count, (count) =>
            on("click", () => count.update((prev) => prev + 1))
          )
        ),
        body: createText(s("+1")),
      }),
      createElement({
        tag: "button",
        modifiers: modifiers(
          minus.modifier,
          updateCell(count, (count) =>
            on("click", () => count.update((prev) => prev - 1))
          )
        ),
        body: createText(s("-1")),
      }),
      createElement({
        tag: "button",
        modifiers: modifiers(
          double.modifier,
          createAttr("type", s("button")),
          updateCell(multiple, (multiple) =>
            on("click", () => multiple.update((prev) => prev * 2))
          )
        ),
        body: createText(s("Double It")),
      }),
    ]),
  };
};

function modifiers(...args: (Modifier | undefined)[]): Modifier[] {
  return args.filter((item): item is Modifier => item !== undefined);
}

function updateCell<T, A extends Args>(
  cell: DependsReactive<T>,
  callback: (reactive: DynamicReactive<T>) => EffectModifier<A>
): Modifier | undefined {
  if (cell.cell instanceof Cell) {
    return callback(cell as DynamicReactive<T>);
  }
}

interface DynamicReactive<T> {
  cell: Cell<T>;
  update: (callback: (value: T) => T) => void;
}

type DependsReactive<T> =
  | DynamicReactive<T>
  | {
      cell: StaticReactive<T>;
    };

function reactive<T>(
  value: T,
  { static: buildStatic }: { static: boolean }
): DependsReactive<T> {
  if (buildStatic) {
    let cell = Reactive.static(value);
    return { cell };
  } else {
    let cell = Cell.of(value);
    let update = (callback: (value: T) => T) => cell.update(callback);
    return { cell, update };
  }
}

function s<T>(value: T): StaticReactive<T> {
  return Reactive.static(value);
}

const ToString = ClosedFunction.of<{ value: Reactive<any> }, string>(
  ({ value }: { value: unknown }): string => String(value)
);
