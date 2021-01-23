import { isCell, isReactive } from "./brands";
import { Cell, Reactive, StableCell } from "./cell";
import { unreachable } from "./utils";

type ChoiceInfo<
  K extends string = string,
  V extends unknown | void = unknown | void
> = {
  discriminant: K;
  value: V;
};

export type Choice<K extends string, V extends unknown | void = void> = {
  discriminant: K;
  value: V;
};

export type ChoiceFor<
  C extends Choices,
  P extends ChoiceKey<C> = ChoiceKey<C>
> = C[P]["value"] extends void
  ? { discriminant: P }
  : { discriminant: P; value: C[P]["value"] };

export type NextChoiceFor<
  C extends Choices,
  P extends ChoiceKey<C> = ChoiceKey<C>
> = C[P]["value"] extends void
  ? { discriminant: P; value: undefined }
  : { discriminant: P; value: C[P]["value"] | Reactive<C[P]["value"]> };

export type ExposedChoiceFor<
  C extends Choices,
  P extends ChoiceKey<C> = ChoiceKey<C>
> = {
  [P in ChoiceKey<C>]: { discriminant: P; value: Reactive<C[P]["value"]> };
}[P];

export type Choices = {
  [P in string]: ChoiceInfo<P>;
};

export type ChoiceKey<C extends Choices> = keyof C & string;

export type ChoiceValue<
  C extends Choices,
  P extends ChoiceKey<C> = ChoiceKey<C>
> = C[P]["value"];

type IsVoidKey<C extends Choices, P> = P extends string
  ? C[P] extends ChoiceInfo<P, void>
    ? P
    : never
  : never;

export type VoidChoices<C extends Choices> = {
  [P in keyof C as IsVoidKey<C, P>]: C[P];
};

export type VoidChoiceKey<C extends Choices> = ChoiceKey<C> &
  keyof VoidChoices<C>;

export type MatchFunction<C extends Choices, U> = <K extends keyof C>(
  value: Reactive<C[K]>
) => U;

export type MatchFunctions<C extends Choices, U> =
  | {
      [P in ChoiceKey<C>]: (value: Reactive<C[P]["value"]>) => U;
    }
  | ((choices: ExposedChoiceFor<C>) => U);

// export interface VariantInfo<
//   K extends string,
//   V extends unknown | void = void
// > {
//   readonly discriminant: K;
//   readonly value: V;
// }

// export type ChoiceVariants<C extends Choices> = {
//   [P in ChoiceKey<C>]: { discriminant: P; value: Reactive<ChoiceValue<C, P>> };
// };

// export type ChoiceVariant<
//   C extends Choices,
//   P extends ChoiceKey<C> = ChoiceKey<C>
// > = ChoiceVariants<C>[P];

// export type ReactiveVariantInfos<C extends Choices> = {
//   [P in ChoiceKey<C>]: {
//     discriminant: P;
//     value: ChoiceValue<C, P>;
//   };
// };

// export type ReactiveVariantParts<
//   C extends Choices,
//   P extends ChoiceKey<C> = ChoiceKey<C>
// > = ReactiveVariantInfos<C>[P];

export type Match<C extends Choices, V> = {
  [P in keyof C]: V;
};

// export type NextVariant<C extends Choices> = {
//   [P in keyof C]: [P, C[P]["value"]];
// }[ChoiceKey<C>];

// export type UpdateMatchFunction<C extends Choices, P> = P extends IsVoidKey<
//   C,
//   P
// >
//   ? () => ChoiceVariant<C>
//   : P extends ChoiceKey<C>
//   ? (value: ChoiceVariant<C, P>) => ChoiceVariant<C>
//   : never;

// export type UpdateMatchFunctions<C extends Choices> =
//   | {
//       [P in keyof C]: MatchFunction<C, P, ChoiceVariant<C>>;
//     }
//   | ((value: ChoiceVariant<C>) => ChoiceVariant<C>);

// export type MatchFunction<C extends Choices, P, U> = P extends IsVoidKey<C, P>
//   ? () => U
//   : P extends ChoiceKey<C>
//   ? (value: Reactive<ChoiceValue<C, P>>) => U
//   : never;

// export type MatchFunctions<C extends Choices, U> =
//   | {
//       [P in keyof C]: MatchFunction<C, P, U>;
//     }
//   | ((value: ChoiceVariant<C>) => U);

type StaticOverload<C extends Choices, K extends ChoiceKey<C>> = [
  [discriminant: K, value: ChoiceValue<C, K>],
  StaticReactiveChoice<C, K>
];

type StaticVoidOverload<C extends Choices, K extends VoidChoiceKey<C>> = [
  [discriminant: K],
  StaticReactiveChoice<C, K>
];

type DynamicVoidOverload<C extends Choices, K extends VoidChoiceKey<C>> = [
  [discriminant: Cell<K>],
  DynamicVoidChoice<C>
];

type StaticValueOverload<C extends Choices, K extends ChoiceKey<C>> = [
  [discriminant: K, value: Cell<ChoiceValue<C, K>>],
  ReactiveChoiceWithStaticDiscriminant<C, K>
];
type DynamicOverload<C extends Choices, K extends ChoiceKey<C>> = [
  [discriminant: Cell<K>, value: Cell<ChoiceValue<C, K>>],
  DynamicReactiveChoice<C>
];

type OneArgOverload<C extends Choices, K extends VoidChoiceKey<C>> =
  | StaticVoidOverload<C, K>
  | DynamicVoidOverload<C, K>;

type TwoArgOverloads<C extends Choices, K extends ChoiceKey<C>> =
  | StaticOverload<C, K>
  | StaticValueOverload<C, K>
  | DynamicOverload<C, K>;

type ReactiveChoiceOverloads<C extends Choices, K extends ChoiceKey<C>> =
  | TwoArgOverloads<C, K>
  | OneArgOverload<C, K & VoidChoiceKey<C>>;

function isStaticOverload<C extends Choices, K extends ChoiceKey<C>>(
  overload: ReactiveChoiceOverloads<C, K>[0]
): overload is [discriminant: K, value: ChoiceValue<C, K>] {
  return overload.length === 2 && isCell(overload[0]) && isCell(overload[1]);
}

function isStaticValueOverload<C extends Choices, K extends ChoiceKey<C>>(
  overload: ReactiveChoiceOverloads<C, K>[0]
): overload is [discriminant: K, value: Cell<ChoiceValue<C, K>>] {
  return overload.length === 2 && !isCell(overload[0]) && isCell(overload[1]);
}

function isDynamicOverload<C extends Choices, K extends ChoiceKey<C>>(
  overload: ReactiveChoiceOverloads<C, K>[0]
): overload is [discriminant: Cell<K>, value: Cell<ChoiceValue<C, K>>] {
  return overload.length === 2 && !isCell(overload[0]) && !isCell(overload[1]);
}

function isStaticVoidOverload<C extends Choices, K extends ChoiceKey<C>>(
  overload:
    | ReactiveChoiceOverloads<C, K>[0]
    | StaticVoidOverload<C, VoidChoiceKey<C>>
): overload is StaticVoidOverload<C, VoidChoiceKey<C>> {
  return overload.length === 1 && !isCell(overload[0]);
}

function isDynamicVoidOverload<C extends Choices, K extends ChoiceKey<C>>(
  overload:
    | ReactiveChoiceOverloads<C, K>[0]
    | DynamicVoidOverload<C, VoidChoiceKey<C>>
): overload is DynamicVoidOverload<C, VoidChoiceKey<C>> {
  return overload.length === 1 && isCell(overload[0]);
}

export abstract class ReactiveChoice<C extends Choices> {
  static of = <
    C extends Choices,
    O extends ReactiveChoiceOverloads<C, ChoiceKey<C>>
  >(
    ...args: O[0]
  ): O[1] => {
    if (isStaticVoidOverload(args)) {
      return new StaticReactiveChoice(args[0] as ChoiceKey<C>, undefined);
    } else if (isDynamicVoidOverload(args)) {
      return new DynamicVoidChoice(args[0] as Cell<ChoiceKey<C>>);
    } else if (isStaticOverload(args)) {
      let [discriminant, value] = args;
      return new StaticReactiveChoice(discriminant, value);
    } else if (isStaticValueOverload(args)) {
      let [discriminant, value]: StaticValueOverload<C, ChoiceKey<C>>[0] = args;
      return new ReactiveChoiceWithStaticDiscriminant(discriminant, value);
    } else if (isDynamicOverload(args)) {
      let [discriminant, value]: DynamicOverload<C, ChoiceKey<C>>[0] = args;
      return new DynamicReactiveChoice(discriminant, value);
    } else {
      throw unreachable("exhaustively matched overload in ReactiveChoice.of");
    }
  };

  declare abstract readonly variantNow: ExposedChoiceFor<C>;

  isStatic(): this is StaticReactiveChoice<C, ChoiceKey<C>> {
    return this instanceof StaticReactiveChoice;
  }

  match<U>(matcher: MatchFunctions<C, U>): U {
    if (typeof matcher === "function") {
      return matcher(this.variantNow);
    } else {
      let { discriminant, value } = this.variantNow;
      let match = matcher[discriminant];
      return match(value);
    }
  }
}

export class StaticReactiveChoice<
  C extends Choices,
  K extends ChoiceKey<C>
> extends ReactiveChoice<C> {
  #discriminant: K;
  #value: ChoiceValue<C>;

  constructor(discriminant: K, value: ChoiceValue<C>) {
    super();
    this.#discriminant = discriminant;
    this.#value = value;
  }

  get variantNow(): ExposedChoiceFor<C> {
    return {
      discriminant: this.#discriminant,
      value: Reactive.static(this.#value),
    };
  }
}

export class ReactiveChoiceWithStaticDiscriminant<
  C extends Choices,
  K extends ChoiceKey<C>
> extends ReactiveChoice<C> {
  #discriminant: K;
  #valueCell: Cell<ChoiceValue<C, K>>;

  constructor(discriminant: K, value: ChoiceValue<C, K>) {
    super();
    this.#discriminant = discriminant;
    this.#valueCell = Cell.of(value);
  }

  get variantNow(): ExposedChoiceFor<C> {
    return { discriminant: this.#discriminant, value: this.#valueCell };
  }

  updateValue(
    callback: (prev: ChoiceValue<C, K>) => Reactive<ChoiceValue<C, K>>
  ): void {
    this.#valueCell.update((prev) => callback(prev));
  }
}

export class DynamicReactiveChoice<
  C extends Choices
> extends ReactiveChoice<C> {
  #discriminantCell: Cell<ChoiceKey<C>>;
  #lastDiscriminant: ChoiceKey<C> | null = null;
  #valueCell: StableCell<ChoiceValue<C>>;

  constructor(
    discriminant: Cell<ChoiceKey<C>>,
    value: Reactive<ChoiceValue<C>>
  ) {
    super();
    this.#discriminantCell = discriminant;
    this.#valueCell = StableCell.of(value);
  }

  get variantNow(): ExposedChoiceFor<C> {
    let discriminant = this.#discriminantCell.now;
    this.#lastDiscriminant = discriminant;

    return { discriminant, value: this.#valueCell };
  }

  update(matcher: MatchFunctions<C, NextChoiceFor<C>>): void {
    let next: NextChoiceFor<C>;
    let lastDiscriminant = this.#lastDiscriminant;

    if (typeof matcher === "function") {
      next = matcher(this.variantNow);
    } else {
      next = this.match(matcher);
    }

    let { discriminant: nextDiscriminant, value: nextValue } = next;

    if (lastDiscriminant !== nextDiscriminant) {
      this.#discriminantCell.update(() => nextDiscriminant);
    }

    // let nextValue = next._reactiveValue();

    if (nextValue !== undefined) {
      if (isReactive(nextValue)) {
        this.#valueCell.setReactive(nextValue);
      } else {
        this.#valueCell.setValue(nextValue);
      }
    }
  }
}

export class DynamicVoidChoice<C extends Choices> extends ReactiveChoice<C> {
  #discriminantCell: Cell<ChoiceKey<C>>;
  #lastDiscriminant: ChoiceKey<C> | null = null;

  constructor(discriminant: Cell<ChoiceKey<C>>) {
    super();
    this.#discriminantCell = discriminant;
  }

  get variantNow(): ExposedChoiceFor<C> {
    let discriminant = this.#discriminantCell.now;
    this.#lastDiscriminant = discriminant;

    return { discriminant, value: Reactive.static(undefined) };
  }

  update(matcher: MatchFunctions<C, ChoiceFor<C>>): void {
    let lastDiscriminant = this.#lastDiscriminant;
    let { discriminant: nextDiscriminant } = this.match(matcher);

    if (lastDiscriminant !== nextDiscriminant) {
      this.#discriminantCell.update(() => nextDiscriminant);
    }
  }
}

export class Variants<C extends Choices> {
  static define<C extends Choices>(): Variants<C> {
    return new Variants();
  }

  next<K extends ChoiceKey<C>>(
    discriminant: K,
    value: ChoiceValue<C, K> | Reactive<ChoiceValue<C, K>>
  ): NextChoiceFor<C>;
  next<K extends VoidChoiceKey<C>>(discriminant: K): NextChoiceFor<C>;
  next<K extends ChoiceKey<C>>(
    discriminant: K,
    value?: ChoiceValue<C, K> | Reactive<ChoiceValue<C, K>>
  ): NextChoiceFor<C> {
    if (value === undefined) {
      return ({ discriminant } as unknown) as NextChoiceFor<C>;
    } else {
      return ({ discriminant, value } as unknown) as NextChoiceFor<C>;
    }
  }

  cell<K extends VoidChoiceKey<C>>(key: K): DynamicVoidChoice<C>;
  cell<K extends ChoiceKey<C>>(
    key: K,
    value: ChoiceValue<C, K>
  ): DynamicReactiveChoice<C>;
  cell<K extends ChoiceKey<C>>(
    key: K,
    value: Reactive<ChoiceValue<C, K>>
  ): DynamicReactiveChoice<C>;
  cell<K extends ChoiceKey<C>>(
    key: K,
    value?: Reactive<ChoiceValue<C, K>> | ChoiceValue<C, K>
  ): ReactiveChoice<C> {
    if (value === undefined) {
      return new DynamicVoidChoice(Cell.of(key));
    } else if (isReactive(value)) {
      return new DynamicReactiveChoice(Cell.of(key), value);
    } else {
      return new DynamicReactiveChoice(Cell.of(key), Cell.of(value));
    }
  }

  of = of<C>();
}

function of<C extends Choices>() {
  function inner<K extends VoidChoiceKey<C>>(
    key: Cell<K>
  ): DynamicVoidChoice<C>;
  function inner<K extends VoidChoiceKey<C>>(
    key: K
  ): StaticReactiveChoice<C, K>;
  function inner<K extends ChoiceKey<C>>(
    key: K,
    value: Cell<C[K]["value"]>
  ): ReactiveChoiceWithStaticDiscriminant<C, K>;
  function inner<K extends ChoiceKey<C>>(
    key: K,
    value: C[K]["value"]
  ): StaticReactiveChoice<C, K>;
  function inner<K extends ChoiceKey<C>>(
    key: Cell<K>,
    value: Cell<C[K]["value"]>
  ): DynamicReactiveChoice<C>;
  function inner<O extends ReactiveChoiceOverloads<C, ChoiceKey<C>>>(
    ...args: O[0]
  ): O[1] {
    return ReactiveChoice.of<C, O>(...args);
  }

  return inner;
}
