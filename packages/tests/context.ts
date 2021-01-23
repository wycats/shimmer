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
    if (this.#assertions.length === 0 && this.#current === "default") {
      this.#current = desc;
      return;
    }

    this.finish();
    this.#current = desc;
  }

  get steps(): readonly Step[] {
    this.finish();
    return this.#steps;
  }
}

export class TestContext {
  #steps: Steps = new Steps();

  constructor(readonly content: HTMLDivElement, readonly desc: string) {}

  async inur(
    content: Content,
    initial: string,
    ...steps: RenderStep[]
  ): Promise<void> {
    let app = Doc.of(document).render(content, Cursor.appending(this.content));
    GLIMMER.addRenderable(app);

    this.step("initial render");
    this.assert(initial);

    for (let step of steps) {
      this.step(step.desc);
      await step.update();
      this.assert(step.expect);
    }
  }

  done(): TestResult {
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
    this.#steps.start(desc);
  }

  assert(expected: string): void {
    let actual = this.content.innerHTML;

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

  render(content: Content, assertions: () => void): void {
    let app = Doc.of(document).render(content, Cursor.appending(this.content));
    GLIMMER.addRenderable(app);
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

export interface Test {
  message: string;
  callback: TestFunction;
}

const TESTS: Test[] = [];

export function test(message: string, callback: TestFunction): void {
  TESTS.push({ message, callback });
}

export async function main<R extends ReporterInstance>(
  reporter: ReporterDefinition<R>
): Promise<void> {
  let { target }: HtmlFragment<HTMLDivElement> = html`<div
    id="test-content"
    data-target
  ></div>`;
  document.body.append(target);

  let module = new ModuleContext(target, "main");

  for (let test of TESTS) {
    let ctx = module.startTest(test.message);
    await test.callback(ctx);
    module.endTest(ctx);
    target.innerHTML = "";
  }

  let results = module.done();

  console.log("RESULTS", results);

  let r = Reporter.of(reporter);
  r.module(results);
}

export interface RenderStep {
  desc: string;
  update: () => void;
  expect: string;
}
