import {
  Cell,
  Choices,
  Reactive,
  ReactiveChoice,
  Variants,
} from "@shimmer/reactive";
import fc from "fast-check";
import { CURRENT_TEST } from "../../context";
import {
  Assertion,
  IntoExpectation,
  IntoPrintable,
  IntoPrintableRecord,
} from "../../types";

export function addError<T extends PrintableScenario>(
  expectation: IntoExpectation,
  scenario: PrintableScenario,
  metadata: fc.RunDetails<[T]>
): void {
  let assertion = Assertion.errOk(expectation, scenario.record, {
    seed: metadata.seed,
    path: metadata.counterexamplePath,
  });

  if (CURRENT_TEST) {
    CURRENT_TEST.assert(assertion);
  } else {
    assertion.throw();
  }
}

export function addSuccess<T>(
  expectation: IntoExpectation,
  actual: { value: T; printable: IntoPrintable }
): void {
  let assertion = Assertion.ok(expectation, actual.printable);

  if (CURRENT_TEST) {
    CURRENT_TEST.assert(assertion);
  }
}

export function reporter(expectation: IntoExpectation) {
  return <T extends PrintableScenario>(result: fc.RunDetails<[T]>): void => {
    if (result.failed) {
      if (result.counterexample) {
        addError(expectation, result.counterexample[0], result);
      } else {
        if (CURRENT_TEST) {
          CURRENT_TEST.assert(
            Assertion.errOk(result.error || "null", {}, { seed: result.seed })
          );
        } else {
          throw new Error(result.error || "unexpected fast-check error");
        }
      }
    } else {
      addSuccess(expectation, { value: true, printable: "success" });
    }
  };
}

export interface PrintableScenario {
  record: IntoPrintableRecord;
  check(): boolean;
}

export class ArbitraryChoice {
  static arbitrary(): fc.Arbitrary<ArbitraryChoice> {
    const variants = fc.array(fc.string(), { minLength: 5, maxLength: 5 });

    return variants.map((v) => new ArbitraryChoice(v, 5));
  }

  #options: string[];
  #variant: fc.Arbitrary<Reactive<string> | string>;
  #index: fc.Arbitrary<number>;

  constructor(options: string[], length: number) {
    this.#options = options;
    this.#index = fc.integer({ min: 0, max: length - 1 });
    this.#variant = arbitraryMaybeCell(
      this.#index.map((index) => this.#options[index])
    );
  }

  get options(): string[] {
    return this.#options;
  }

  choice(): fc.Arbitrary<ReactiveChoice<Choices>> {
    return this.#variant.map((s) => ReactiveChoice.of(s));
  }
}

export function arbitraryChoice(): fc.Arbitrary<ReactiveChoice<Choices>> {
  const choice = Variants.define();
  const variants = fc.array(fc.string(), { minLength: 5, maxLength: 5 });

  let variant = variants.chain((choices) => {
    return fc.integer({ min: 0, max: 4 }).map((index) => choices[index]);
  });

  return arbitraryReactive(variant).map((variant) =>
    ReactiveChoice.of(variant as any)
  );
}

export function arbitraryMaybeCell<T>(
  value: fc.Arbitrary<T>
): fc.Arbitrary<Cell<T> | T> {
  return fc
    .record({ value, isStatic: fc.boolean() })
    .map(({ value, isStatic }) => {
      if (isStatic) {
        return value;
      } else {
        return Reactive.cell(value);
      }
    });
}

export function arbitraryReactive<T>(
  value: fc.Arbitrary<T>
): fc.Arbitrary<Reactive<T>> {
  return fc
    .record({ value, isStatic: fc.boolean() })
    .map(({ value, isStatic }) => {
      if (isStatic) {
        return Reactive.static(value);
      } else {
        return Reactive.cell(value);
      }
    });
}

export type Prop<T extends PrintableScenario> = fc.IProperty<[T]>;
