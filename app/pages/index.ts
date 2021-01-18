import { registerDestructor } from "@glimmer/destroyable";
import {
  App,
  Cell,
  Choice,
  component,
  ComponentData,
  each,
  EFFECTS,
  element,
  fragment,
  IntoReactive,
  match,
  Owner,
  Pure,
  Reactive,
  text,
  tree,
} from "../../src/index";
import { Nav } from "./nav";
import { page, PageHooks, RenderOptions, StaticOptions } from "./page";
import { Bool, on } from "./utils";

interface CountValue {
  id: number;
  value: number;
}

// TODO:
// 1. make the proxy
// 2. catch using reactive values in static contexts

/**
 * IntoReactive -> Reactive
 *
 * 1. if IntoReactive is a primitive, return Reactive.static(it)
 * 2. if IntoReactive is a Reactive<T>, return it
 * 3. otherwise, return ReactiveProxy(it)
 *
 * external: Reactive#deref
 *
 * ReactiveProxy.get(object, key)
 *
 * 1. let inner = object[key]
 * 2. return IntoReactive(inner)
 */

interface Person {
  name: {
    first: Reactive<string>;
  };
}

interface ContactData extends ComponentData {
  args: {
    person: Reactive<Person>;
  };
}

export const Contact = component<Owner, ContactData>(
  (_owner: Owner) => ({ args: { person } }: ContactData) => {
    return text(Pure.of(() => person.now.name.first.now));
  }
);

export const Count = component(
  (owner: Owner) => ({
    args: { counter },
  }: {
    args: { counter: Reactive<CountValue> };
    blocks: {};
  }) => {
    let secondary = Cell.of(rand());

    return fragment(
      Contact(owner)({
        args: {
          person: {
            name: {
              first: Pure.of(() => String(secondary.now)),
            },
          },
        },
      }),
      text(" "),
      element(
        "p",
        { class: Pure.of(() => `count-${counter.now.value}`) },
        fragment(
          element(
            "button",
            {
              [EFFECTS]: [on("click", () => secondary.update(rand))],
            },
            text("randomize")
          ),
          text(Pure.of(() => String(counter.now.value))),
          text("::"),
          element(
            "span",
            { class: "count" },
            text(Pure.of(() => String(secondary.now)))
          )
        )
      )
    );
  }
);

function rand() {
  return Math.floor(Math.random() * 100);
}

type ReactiveCounts = Reactive<Iterable<IntoReactive<CountValue>>>;

const Texts = component(
  (owner: Owner) => ({
    args: { counts },
  }: {
    args: { counts: ReactiveCounts };
  }) => {
    return each<CountValue>(
      counts,
      (i) => String(i.id),
      (counter) => Count(owner)({ args: { counter }, blocks: {} })
    );
  }
);

const Cond = component(
  () => ({
    args: { bool },
  }: {
    args: { bool: Reactive<Choice<Bool>> };
    blocks: {};
  }) => {
    return match(bool, {
      true: () => text("true"),
      false: () => text("false"),
    });
  }
);

const Hello = component(
  (owner: Owner) => ({
    args: { counts, bool },
  }: {
    args: {
      counts: ReactiveCounts;
      bool: Reactive<Choice<Bool>>;
    };
    blocks: {};
  }) => {
    return fragment(
      Nav(owner)(),
      Texts(owner)({ args: { counts } }),
      Cond(owner)({ args: { bool } })
    );
  }
);

interface IndexState {
  tick: number;
  readonly counts: Cell<Cell<CountValue>[]>;
  readonly bool: Cell<Choice<Bool>>;
}

export class IndexPage implements PageHooks<IndexState> {
  construct(): IndexState {
    let countValues: Cell<CountValue>[] = [];

    for (let i = 0; i < 10; i++) {
      countValues.push(Cell.of({ id: i, value: i }));
    }

    let counts = Reactive.cell(countValues);
    let bool = Cell.of(Bool.of("true", Reactive.static(true)));

    return {
      tick: 0,
      counts,
      bool,
    };
  }

  render(
    state: IndexState,
    { owner }: StaticOptions,
    { cursor }: RenderOptions
  ): App {
    let doc = owner.service("doc");
    let { counts, bool } = state;

    let hello = Hello(owner)({ args: { counts, bool } });
    console.log(tree(hello));

    let app = doc.render(hello, cursor);

    let token = setInterval(() => this.#increment(state), 1000);
    registerDestructor(app, () => clearInterval(token));

    return app;
  }

  #increment = (state: IndexState): void => {
    state.tick++;
    console.log("tick", state.tick);

    if (state.tick % 2 === 0) {
      state.counts.update((c) => {
        return c.map((value) => {
          let now = value.now;
          return Cell.of({ id: now.id, value: now.value + 1 });
        });
      });
    } else {
      state.counts.now.forEach((c) =>
        c.update((i) => ({ id: i.id, value: i.value + 1 }))
      );
    }

    state.bool.update((last) => {
      return last.match<Choice<Bool>>({
        true: () => Bool.of("false", Reactive.static(false)),
        false: () => Bool.of("true", Reactive.static(true)),
      });
    });
  };
}

export const Main = page(() => new IndexPage());
