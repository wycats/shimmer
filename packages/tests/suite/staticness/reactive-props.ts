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

export class ReactiveModel<T extends IntoPrintable>
  implements PrintableScenario {
  static arbitrary<T extends IntoPrintable>(
    value: Arbitrary<T>
  ): Arbitrary<ReactiveModel<T>> {
    return fc
      .record({ value, isStatic: fc.boolean() })
      .map(({ value, isStatic }) => {
        if (isStatic) {
          return new ReactiveModel(Reactive.static(value), true);
        } else {
          return new ReactiveModel(Reactive.cell(value), false);
        }
      });
  }

  static property<T extends IntoPrintable>(
    value: Arbitrary<T>
  ): Prop<ReactiveModel<T>> {
    let arbitrary = ReactiveModel.arbitrary(value);

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

export class ClosedFunctionModel implements PrintableScenario {
  static arbitrary() {
    let args = fc.dictionary(fc.string(), ReactiveModel.arbitrary(fc.string()));
    let func = ClosedFunction.of((args: Record<string, Reactive<string>>) => {
      let out: Record<string, string> = {};

      for (let [key, value] of Object.entries(args)) {
        out[key] = value.now;
      }

      return out;
    });

    return args.map((args) => {
      let out: Record<string, Reactive<string>> = {};
      let isStatic = true;

      for (let [key, value] of Object.entries(args)) {
        let reactive = value.reactive;
        out[key] = reactive;
        isStatic = isStatic && isStaticReactive(reactive);
      }

      let result = func(out);
      return new ClosedFunctionModel(args, result, isStatic);
    });
  }

  static property(): Prop<ClosedFunctionModel> {
    let arbitrary = ClosedFunctionModel.arbitrary();

    return fc.property(arbitrary, (model) => model.check());
  }

  constructor(
    readonly args: Record<string, ReactiveModel<string>>,
    readonly reactive: Reactive<Record<string, string>>,
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
      args: mapRecord(this.args, (model) => model.record),
      now: this.reactive.now,
      expected: this.expectedStatic ? "static" : "dynamic",
    };
  }
}
