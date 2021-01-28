import {
  ClosedFunction,
  isStaticReactive,
  mapRecord,
  Reactive,
} from "@shimmer/reactive";
import type { Arbitrary } from "fast-check";
import fc from "fast-check";
import type { IntoPrintable, IntoPrintableRecord } from "../../types";
import type { PrintableScenario, Prop } from "./utils";

export class CellModel<T extends IntoPrintable> implements PrintableScenario {
  static arbitrary<T extends IntoPrintable>(
    value: Arbitrary<T>
  ): Arbitrary<CellModel<T>> {
    return fc
      .record({ value, isStatic: fc.boolean() })
      .map(({ value, isStatic }) => {
        if (isStatic) {
          return new CellModel(Reactive.static(value), true);
        } else {
          return new CellModel(Reactive.cell(value), false);
        }
      });
  }

  static property<T extends IntoPrintable>(
    value: Arbitrary<T>
  ): Prop<CellModel<T>> {
    let arbitrary = CellModel.arbitrary(value);

    return fc.property(arbitrary, (model) => model.check());
  }

  constructor(
    readonly reactive: Reactive<T>,
    readonly expectedStatic: boolean
  ) {}

  get record(): IntoPrintableRecord {
    return {
      type: this.reactive.constructor.name,
      now: this.reactive.now,
      expected: this.expectedStatic ? "static" : "dynamic",
    };
  }

  check(): boolean {
    if (this.expectedStatic) {
      return isStaticReactive(this.reactive);
    } else {
      return !isStaticReactive(this.reactive);
    }
  }
}

export class ArgsRecordModel<T extends IntoPrintable>
  implements PrintableScenario {
  static memo<T extends IntoPrintable>(
    value: Arbitrary<T>
  ): fc.Memo<ArgsRecordModel<T>> {
    return fc.memo((n) => {
      let dict;

      if (n <= 1) {
        dict = fc.dictionary(fc.string(), leaf(value));
      } else {
        dict = fc.dictionary(fc.string(), ReactiveModel.memo(value)());
      }

      return dict.map(ArgsRecordModel.of);
    });
  }

  static of<T extends IntoPrintable>(
    dictionary: Record<string, AnyReactiveModel<T>>
  ): ArgsRecordModel<T> {
    let expectsStatic = true;

    for (let value of Object.values(dictionary)) {
      if (!isStaticReactive(value.reactive)) {
        expectsStatic = false;
        break;
      }
    }

    return new ArgsRecordModel(dictionary, expectsStatic);
  }

  constructor(
    readonly dictionary: Record<string, AnyReactiveModel<T>>,
    readonly expectedStatic: boolean
  ) {}

  get args(): Record<string, Reactive<T>> {
    return mapRecord(this.dictionary, (value) => value.reactive);
  }

  get record(): IntoPrintableRecord {
    return {
      type: "Args",
      args: mapRecord(this.dictionary, (a) => a.record),
    };
  }

  check(): boolean {
    if (this.expectedStatic) {
      return isStaticReactive(this.args);
    } else {
      return !isStaticReactive(this.args);
    }
  }
}

export class ClosedFunctionModel<T extends IntoPrintable>
  implements PrintableScenario {
  static memo<T extends IntoPrintable>(
    value: Arbitrary<T>
  ): fc.Memo<ClosedFunctionModel<T>> {
    return fc.memo(() => {
      let args = ArgsRecordModel.memo(value)();

      return fc.tuple(args, value).map(([args, value]) => {
        let func = ClosedFunction.of((_args: Record<string, T>) => {
          return value;
        });

        let result = func(args.args);
        return new ClosedFunctionModel(args, result, args.expectedStatic);
      });
    });
  }

  constructor(
    readonly args: ArgsRecordModel<T>,
    readonly reactive: Reactive<T>,
    readonly expectedStatic: boolean
  ) {}

  check(): boolean {
    if (this.expectedStatic) {
      return isStaticReactive(this.reactive);
    } else {
      return !isStaticReactive(this.reactive);
    }
  }

  get record(): IntoPrintableRecord {
    return {
      type: "ClosedFunction",
      args: this.args.record,
      now: this.reactive.now,
      expected: this.expectedStatic ? "static" : "dynamic",
    };
  }
}

type LeafModel<T extends IntoPrintable> = CellModel<T>;

type AnyReactiveModel<T extends IntoPrintable> =
  | LeafModel<T>
  | ClosedFunctionModel<T>;

function leaf<T extends IntoPrintable>(
  value: Arbitrary<T>
): Arbitrary<CellModel<T>> {
  return fc.oneof(CellModel.arbitrary(value));
}

export const ReactiveModel = {
  memo: <T extends IntoPrintable>(
    value: Arbitrary<T>
  ): fc.Memo<AnyReactiveModel<T>> => {
    return fc.memo(() =>
      fc.oneof(CellModel.arbitrary(value), ClosedFunctionModel.memo(value)())
    );
  },

  property: <T extends IntoPrintable>(
    value: Arbitrary<T>
  ): ((depth: number) => Prop<AnyReactiveModel<T>>) => {
    return (n: number) => {
      let arbitrary = ReactiveModel.memo(value)(n);

      return fc.property(arbitrary, (model) => model.check());
    };
  },
};
