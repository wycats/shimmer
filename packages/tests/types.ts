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
  static of(message: IntoPrintable): Printable {
    if (typeof message === "string") {
      return new Printable(() => message);
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

export type IntoPrintable = Printable | string;

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

export interface OkAssertion {
  type: "assertion";
  status: "ok";
  expectation: Expectation;
  actual: Printable;
}

export interface ErrAssertion {
  type: "assertion";
  status: "err";
  expectation: Expectation;
  actual: Printable;
  expected: Printable;
}

export type Assertion = OkAssertion | ErrAssertion;

export interface OkTest {
  name: string;
  status: "ok";
  todo: boolean;
  steps: readonly Step[];
}

export interface ErrTest {
  name: string;
  status: "err";
  todo: boolean;
  steps: readonly Step[];
}

export interface SkippedTest {
  name: string;
  status: "skipped";
}

export type TestResult = OkTest | ErrTest | SkippedTest;
export type SuccessfulTestResult = OkTest | SkippedTest;

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
