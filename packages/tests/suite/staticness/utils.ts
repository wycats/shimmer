import { Reactive } from "@shimmer/reactive";
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
