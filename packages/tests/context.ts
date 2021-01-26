import { Content, Doc, GLIMMER } from "@shimmer/core";
import { Cursor } from "@shimmer/dom";
import {
  Assertion,
  Expectation,
  ModuleResult,
  OkAssertion,
  OkStep,
  Printable,
  Step,
  SuccessfulTestResult,
  TestResult,
} from "./types";
import {
  html,
  HtmlFragment,
  Reporter,
  ReporterDefinition,
  ReporterInstance,
} from "./ui";

class Steps {
  #steps: Step[] = [];
  #assertions: Assertion[] = [];
  #current = "default";

  addAssertion(assertion: Assertion): void {
    this.#assertions.push(assertion);
  }

  finish(): void {
    if (this.#assertions.every((a): a is OkAssertion => a.status === "ok")) {
      this.#steps.push({
        type: "step",
        status: "ok",
        desc: this.#current,
        assertions: this.#assertions,
      });
    } else {
      this.#steps.push({
        type: "step",
        status: "err",
        desc: this.#current,
        assertions: this.#assertions,
      });
    }

    this.#current = "default";
    this.#assertions = [];
  }

  start(desc: string): void {
    this.finish();

    if (this.#assertions.length === 0 && this.#current === "default") {
      this.#current = desc;
      return;
    }

    this.#current = desc;
  }

  get steps(): readonly Step[] {
    this.finish();
    return this.#steps;
  }
}

export class TestContext {
  #steps: Steps = new Steps();
  #done = false;

  constructor(readonly content: HTMLDivElement, readonly desc: string) {}

  #assertNotDone = (op: string) => {
    if (this.#done === true) {
      throw new Error(
        `Unexpected ${op} outside of a test. Did you forget an 'await'?`
      );
    }
  };

  async inur(
    content: Content,
    initial: string,
    ...steps: RenderStep[]
  ): Promise<void> {
    this.#assertNotDone("inur");

    let app = Doc.of(document).render(content, Cursor.appending(this.content));
    GLIMMER.render(app);
    await GLIMMER.wait();

    this.step("initial render");
    this.assertHTML(initial);

    for (let step of steps) {
      this.step(step.desc);
      step.update();
      await GLIMMER.wait();
      this.assertHTML(step.expect);
    }
  }

  done(): TestResult {
    this.#done = true;
    let steps = this.#steps.steps;

    if (steps.every((s): s is OkStep => s.status === "ok")) {
      return {
        name: this.desc,
        status: "ok",
        todo: false,
        steps,
      };
    } else {
      return {
        name: this.desc,
        status: "err",
        todo: false,
        steps,
      };
    }
  }

  step(desc: string): void {
    this.#assertNotDone("step");

    this.#steps.start(desc);
  }

  assert(assertion: boolean, desc: string): void {
    this.#assertNotDone("assert");

    if (assertion) {
      this.#steps.addAssertion({
        type: "assertion",
        status: "ok",
        expectation: Expectation.of(desc),
        actual: Printable.of("ok"),
      });
    } else {
      this.#steps.addAssertion({
        type: "assertion",
        status: "err",
        expectation: Expectation.of(desc),
        actual: Printable.of("ok"),
        expected: Printable.of("not ok"),
      });
    }
  }

  assertHTML(expected: string, el: Element | null = this.content): void {
    this.#assertNotDone("assertHTML");

    if (el === null) {
      this.#steps.addAssertion({
        type: "assertion",
        status: "err",
        expectation: Expectation.of("element was not null"),
        actual: Printable.of("null"),
        expected: Printable.of("not null"),
      });
      return;
    }

    let actual = el.innerHTML;

    if (expected === actual) {
      this.#steps.addAssertion({
        type: "assertion",
        status: "ok",
        expectation: Expectation.of("rendered body was"),
        actual: Printable.of(actual),
      });
    } else {
      this.#steps.addAssertion({
        type: "assertion",
        status: "err",
        expectation: Expectation.of("rendered body was"),
        actual: Printable.of(actual),
        expected: Printable.of(expected),
      });
    }
  }

  async update(callback: () => void, assertions: () => void): Promise<void> {
    callback();

    await GLIMMER.wait();
    assertions();
  }

  async render(content: Content, assertions: () => void): Promise<void> {
    let app = Doc.of(document).render(content, Cursor.appending(this.content));
    GLIMMER.render(app);
    await GLIMMER.wait();
    assertions();
  }
}

export class ModuleContext {
  #tests: TestResult[] = [];

  constructor(readonly content: HTMLDivElement, readonly name: string) {}

  async update(callback: () => void, assertions: () => void): Promise<void> {
    callback();
    await GLIMMER.wait();
    assertions();
  }

  startTest(name: string): TestContext {
    return new TestContext(this.content, name);
  }

  endTest(test: TestContext): void {
    this.#tests.push(test.done());
  }

  skip(name: string, focusMode: boolean) {
    this.#tests.push({ name, status: "skipped", focusMode });
  }

  done(): ModuleResult {
    if (
      this.#tests.every(
        (t): t is SuccessfulTestResult =>
          t.status === "ok" || t.status === "skipped"
      )
    ) {
      return {
        status: "ok",
        desc: this.name,
        tests: this.#tests,
      };
    } else {
      return {
        status: "err",
        desc: this.name,
        tests: this.#tests,
      };
    }
  }
}

export type TestFunction = (context: TestContext) => void | Promise<void>;

export class Test {
  constructor(
    readonly message: string,
    readonly callback: TestFunction,
    readonly run: boolean,
    readonly focusMode: boolean = false
  ) {}

  focusRun(): Test {
    if (this.run === false) {
      throw new Error(`You can't focus a skipped test`);
    } else {
      return new Test(this.message, this.callback, true, true);
    }
  }

  focusSkip(): Test {
    return new Test(this.message, this.callback, false, true);
  }
}

class TestModule {
  constructor(
    readonly desc: string,
    readonly tests: Test[],
    readonly focus: Test[] | null
  ) {}
}

const MODULES: TestModule[] = [];

// const TESTS: Test[] = [];

export function module(
  desc: string,
  callback: (test: ModuleTestCallback) => void
): void {
  let tests: Test[] = [];
  let focus: Set<Test> = new Set();

  function TestFunction(message: string, callback: TestFunction): void {
    tests.push(new Test(message, callback, true));
  }

  TestFunction.focus = (message: string, callback: TestFunction): void => {
    let test = new Test(message, callback, true);
    tests.push(test);
    focus.add(test);
  };

  TestFunction.skip = (message: string, callback: TestFunction): void => {
    let test = new Test(message, callback, false);
    tests.push(test);
  };

  callback(TestFunction);

  if (focus.size === 0) {
    let module = new TestModule(desc, tests, null);
    MODULES.push(module);
  } else {
    tests = tests.map((t) => {
      if (focus.has(t)) {
        return t.focusRun();
      } else {
        return t.focusSkip();
      }
    });
    let module = new TestModule(desc, tests, [...focus]);
    MODULES.push(module);
  }
}

interface ModuleTestCallback {
  (message: string, callback: TestFunction): void;
  focus: (message: string, callback: TestFunction) => void;
  skip: (message: string, callback: TestFunction) => void;
}

export class TestTest {}

// export function test(message: string, callback: TestFunction): void {
//   TESTS.push({ message, callback });
// }

export async function main<R extends ReporterInstance>(
  reporter: ReporterDefinition<R>
): Promise<void> {
  let { target }: HtmlFragment<HTMLDivElement> = html`<div
    id="test-content"
    data-target
  ></div>`;
  document.body.append(target);
  let r = Reporter.of(reporter);

  for (let module of MODULES) {
    let moduleCtx = new ModuleContext(target, module.desc);

    for (let test of module.tests) {
      if (test.run) {
        let ctx = moduleCtx.startTest(test.message);
        await test.callback(ctx);
        moduleCtx.endTest(ctx);
        target.innerHTML = "";
      } else {
        moduleCtx.skip(test.message, test.focusMode);
      }
    }

    let results = moduleCtx.done();
    console.log("RESULTS", results);
    r.module(results);
  }
}

export interface RenderStep {
  desc: string;
  update: () => void;
  expect: string;
}
