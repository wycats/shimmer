import { registerDestructor } from "@glimmer/destroyable";
import { App, Choice, withRealm } from "@shimmer/core";
import { tree } from "@shimmer/debug";
import { def, each, match } from "@shimmer/dsl";
import { Cell, IntoReactive, Reactive } from "@shimmer/reactive";
import { NavBar } from "./nav";
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

export const Contact = def(({ person }: { person: Reactive<Person> }) => {
  return <>{() => person.now.name.first.now}</>;
});

export const Count = def(({ counter }: { counter: Reactive<CountValue> }) => {
  let secondary = Cell.of(`Person #${rand()}`);

  return (
    <>
      <Contact person={{ name: { first: secondary } }} />
      <p class={() => `count-${counter.now.value}`}>
        <button
          use-effect={on("click", () =>
            secondary.update(() => `Person #${rand()}`)
          )}
        >
          randomize
        </button>
        {() => counter.now.value}::
        <span class="count">{secondary}</span>
      </p>
    </>
  );
});

function rand() {
  return Math.floor(Math.random() * 100);
}

type ReactiveCounts = Reactive<Iterable<IntoReactive<CountValue>>>;

const Texts = def(({ counts }: { counts: ReactiveCounts }) => {
  let c = <Count counter={(null as any) as CountValue} />;

  return each(
    counts,
    (i) => String(i.id),
    (counter: CountValue) => <Count counter={counter} />
  );
});

const Cond = def(({ bool }: { bool: Reactive<Choice<Bool>> }) =>
  match(bool, { true: () => <>true</>, false: () => <>false</> })
);

const Hello = def(
  ({
    counts,
    bool,
  }: {
    counts: ReactiveCounts;
    bool: Reactive<Choice<Bool>>;
  }) => (
    <>
      <NavBar />
      <Texts counts={counts} />
      <Cond bool={bool} />
    </>
  )
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
    let { counts, bool } = state;

    let app = withRealm(owner, () => {
      let hello = <Hello counts={counts} bool={bool} />;
      console.log(tree(hello));
      return owner.service("doc").render(hello, cursor);
    });

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
