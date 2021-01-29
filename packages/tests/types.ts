import { isObject, unreachable } from "@shimmer/reactive";

export interface OkStep {
  type: "step";
  status: "ok";
  desc: string;
  assertions: readonly OkAssertion[];
}

export interface ErrStep {
  type: "step";
  status: "err";
  desc: string;
  assertions: readonly Assertion[];
}

export type Step = OkStep | ErrStep;

export class Printable {
  static is(value: unknown): value is Printable {
    return isObject(value) && value instanceof Printable;
  }

  static of(message: IntoPrintable): Printable {
    if (
      typeof message === "string" ||
      typeof message === "number" ||
      typeof message === "boolean" ||
      typeof message === "undefined"
    ) {
      return new Printable(() => String(message));
    } else if (message === null) {
      return new Printable(() => "null");
    } else {
      return message;
    }
  }

  #callback: () => string;
  constructor(callback: () => string) {
    this.#callback = callback;
  }

  get print(): string {
    return this.#callback();
  }
}

export type IntoPrintable =
  | Printable
  | string
  | number
  | boolean
  | null
  | undefined;

export function isIntoPrintable(value: unknown): value is IntoPrintable {
  switch (typeof value) {
    case "string":
    case "number":
    case "boolean":
    case "undefined":
      return true;
    default:
      return value === null || Printable.is(value);
  }
}

export class Expectation {
  static of(expectation: IntoExpectation): Expectation {
    if (typeof expectation === "string") {
      return new Expectation(expectation);
    } else {
      return expectation;
    }
  }

  #message: string;

  constructor(message: string) {
    this.#message = message;
  }

  get print(): string {
    return this.#message;
  }
}

export type IntoExpectation = Expectation | string;

export abstract class AbstractAssertion {
  declare abstract readonly status: "ok" | "err:ok" | "err:eq";
}

export class OkAssertion extends AbstractAssertion {
  readonly status = "ok";

  constructor(readonly expectation: Expectation, readonly actual: Printable) {
    super();
  }
}

export class ErrEqAssertion extends AbstractAssertion {
  readonly status = "err:eq";

  constructor(
    readonly expectation: Expectation,
    readonly actual: Printable,
    readonly expected: Printable
  ) {
    super();
  }

  throw(): never {
    throw new Error(
      `${this.expectation.print}: expected ${this.expected.print}, got ${this.actual.print}`
    );
  }
}

export class ErrOkAssertion extends AbstractAssertion {
  readonly status = "err:ok";

  constructor(
    readonly expectation: Expectation,
    readonly error: ErrorDetails,
    readonly metadata?: Metadata
  ) {
    super();
  }

  throw(): never {
    throw new Error(`${this.expectation.print}`);
  }
}

export type Assertion = OkAssertion | ErrEqAssertion | ErrOkAssertion;

export type ErrorDetails = PrintableRecord;
export type Metadata = PrintableRecord;

export type PrintableRecord = { [P in string]: Printable | PrintableRecord };
export type IntoPrintableRecord = {
  [P in string]: IntoPrintableRecord | IntoPrintable;
};

export function intoPrintableRecord(
  into: IntoPrintableRecord
): PrintableRecord {
  let out: PrintableRecord = {};

  for (let [key, value] of Object.entries(into)) {
    if (isIntoPrintable(value)) {
      out[key] = Printable.of(value);
    } else {
      out[key] = intoPrintableRecord(value);
    }
  }

  return out;
}

export type IntoAssertion =
  | {
      status: "ok";
      expectation: IntoExpectation;
      actual: IntoPrintable;
    }
  | {
      status: "err:eq";
      expectation: IntoExpectation;
      actual: IntoPrintable;
      expected: IntoPrintable;
    }
  | {
      status: "err:ok";
      expectation: IntoExpectation;
      error: ErrorDetails;
      metadata?: Metadata;
    };

export const Assertion = {
  of(assertion: IntoAssertion): Assertion {
    if (
      assertion instanceof OkAssertion ||
      assertion instanceof ErrEqAssertion
    ) {
      return assertion;
    } else if (assertion.status === "ok") {
      return Assertion.ok(assertion.expectation, assertion.actual);
    } else if (assertion.status === "err:eq") {
      return Assertion.errEq(
        assertion.expectation,
        assertion.actual,
        assertion.expected
      );
    } else if (assertion.status === "err:ok") {
      return Assertion.errOk(
        assertion.expectation,
        assertion.error,
        assertion.metadata
      );
    } else {
      unreachable(`exhaustive`, assertion);
    }
  },
  ok(expectation: IntoExpectation, actual: IntoPrintable): OkAssertion {
    return new OkAssertion(Expectation.of(expectation), Printable.of(actual));
  },

  errOk(
    expectation: IntoExpectation,
    error: IntoPrintableRecord,
    metadata?: IntoPrintableRecord
  ): ErrOkAssertion {
    return new ErrOkAssertion(
      Expectation.of(expectation),
      intoPrintableRecord(error),
      metadata ? intoPrintableRecord(metadata) : undefined
    );
  },

  errEq(
    expectation: IntoExpectation,
    actual: IntoPrintable,
    expected: IntoPrintable
  ): ErrEqAssertion {
    return new ErrEqAssertion(
      Expectation.of(expectation),
      Printable.of(actual),
      Printable.of(expected)
    );
  },
};

abstract class AbstractTestResult {
  abstract readonly status: string;

  constructor(readonly name: string) {}
}

interface DoneTestMetadata {
  todo: boolean;
  elapsed: number;
}

abstract class AbstractDoneTestResult extends AbstractTestResult {
  constructor(
    name: string,
    readonly steps: readonly Step[],
    readonly metadata: DoneTestMetadata
  ) {
    super(name);
  }
}

class OkTest extends AbstractDoneTestResult {
  readonly status = "ok";
}

class ErrTest extends AbstractDoneTestResult {
  readonly status = "err";
}

interface SkippedTestMetadata {
  focusMode: boolean;
}

class SkippedTest extends AbstractTestResult {
  readonly status = "skipped";

  constructor(name: string, readonly metadata: SkippedTestMetadata) {
    super(name);
  }
}

export type TestResult = OkTest | ErrTest | SkippedTest;
export type SuccessfulTestResult = OkTest | SkippedTest;

export const TestResult = {
  ok(name: string, steps: readonly Step[], metadata: DoneTestMetadata): OkTest {
    return new OkTest(name, steps, metadata);
  },

  err(
    name: string,
    steps: readonly Step[],
    metadata: DoneTestMetadata
  ): ErrTest {
    return new ErrTest(name, steps, metadata);
  },

  skipped(name: string, metadata: SkippedTestMetadata): SkippedTest {
    return new SkippedTest(name, metadata);
  },
};

export interface OkModule {
  desc: string;
  status: "ok";
  tests: readonly SuccessfulTestResult[];
}

export interface ErrModule {
  desc: string;
  status: "err";
  tests: readonly TestResult[];
}

export type ModuleResult = OkModule | ErrModule;
