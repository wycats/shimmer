import { enumerate, isObject, unreachable } from "@shimmer/reactive";
import type { Assertion, ModuleResult, Step, TestResult } from "./types";

export interface ReporterDefinition<T extends ReporterInstance> {
  begin(): T;
}

// export type ReporterDefinition<T extends ReporterInstance> = () => T;

export interface ReporterInstance {
  module(module: ModuleResult): void;
  cleanup(): void;
}

export class Reporter {
  static of<R extends ReporterInstance>(
    definition: ReporterDefinition<R>
  ): Reporter {
    return new Reporter(definition.begin());
  }

  #reporter: ReporterInstance;

  constructor(reporter: ReporterInstance) {
    this.#reporter = reporter;
  }

  module(module: ModuleResult): void {
    this.#reporter.module(module);
  }

  cleanup(): void {
    this.#reporter.cleanup();
  }
}

export class DOMReporter implements ReporterInstance {
  static begin(): DOMReporter {
    let {
      fragment,
      target,
      targets: { checkbox, log, summary },
    }: HtmlFragment<
      HTMLTableSectionElement,
      {
        checkbox: HTMLInputElement;
        log: HTMLTableElement;
        summary: HTMLDivElement;
      }
    > = html`
      <style>
        * {
          box-sizing: border-box;
        }

        :root {
          --test-ok-bg: #cfc;
          --test-ok-fg: #363;
          --test-err-bg: #fcc;
          --test-err-fg: #633;
          --step-bg: #eef;
          --step-fg: #669;
          --pad: var(--v-pad) var(--h-pad);
          --v-pad: 0.3rem;
          --thin-v-pad: 0.1rem;
          --h-pad: 0.2rem;
          --pad: 0.5rem;
          --full-width: 1 / span 4;
        }

        th,
        td {
          display: block;
        }

        p,
        div,
        span,
        table,
        tbody,
        td,
        tr,
        th,
        thead {
          margin: unset;
          padding: unset;
        }

        div.summary {
          display: grid;
          grid-auto-columns: auto;
          padding: var(--pad);
          margin: var(--pad);
          border: 1px solid #333;
        }

        div.summary div.tests {
          display: grid;
          grid-template: "title summary" / max-content 1fr;
          gap: 1rem;
        }

        div.summary div.tests > p.title {
          grid-area: title;
        }

        div.summary div.tests > p.summary {
          grid-area: summary;
          display: grid;
          grid-template: "ok err skipped" / max-content max-content max-content;
          column-gap: 1rem;
        }

        div.summary div.tests > p.summary > span {
          color: gray;
        }

        div.summary div.tests > p.summary > .ok {
          color: green;
          font-weight: bold;
        }

        div.summary div.tests > p.summary > .err.some {
          color: red;
          font-weight: bold;
        }

        div.summary div.tests > p.summary > .ok:after {
          content: " succeeded";
        }

        div.summary div.tests > p.summary > .err:after {
          content: " failed";
        }

        div.summary div.tests > p.summary > .skipped:after {
          content: " skipped";
        }

        table#log {
          width: 100%;
          display: grid;
          grid-template-columns: max-content max-content 1fr 1fr;
          align-items: center;
          margin-top: var(--v-pad);
        }

        table#log table {
          display: grid;
          margin-left: 0.5rem;
        }

        table#log table.test {
          display: grid;
        }

        table#log th {
          margin-bottom: var(--v-pad);
        }

        table#log td,
        table#log th {
          padding: var(--v-pad) var(--h-pad);
        }

        table#log thead td {
          grid-column: var(--full-width);
          padding: var(--v-pad) var(--h-pad);
        }

        table#log.hide-passed .step.ok {
          display: none;
        }

        table#log td.full,
        table#log th.full {
          grid-column: var(--full-width);
          margin: 0;
          padding: 0 var(--h-pad);
        }

        table#log tr.description > th.full {
          margin-top: var(--v-pad);
          margin-bottom: var(--v-pad);
          padding-top: var(--v-pad);
          padding-bottom: var(--v-pad);
        }

        table#log table.test > thead > tr.description > th {
          display: grid;
          padding: 0;
          grid-template-columns: max-content 1fr;
        }

        table#log table.test > thead > tr.description > th > span {
          padding: var(--v-pad) var(--h-pad);
        }

        table#log table.test.ok > thead > tr.description > th > span {
          background-color: var(--test-ok-bg);
        }

        table#log table.test.err > thead > tr.description > th > span {
          background-color: var(--test-err-bg);
        }

        table#log table.test.ok > thead > tr.description > th {
          color: var(--test-ok-fg);
        }

        table#log table.test.err > thead > tr.description > th {
          background-color: var(--test-err-bg);
          color: var(--test-err-fg);
        }

        table#log table.step-table > thead > tr.description > th {
          background-color: var(--step-bg);
          color: var(--step-fg);
        }

        thead,
        tbody,
        tr {
          display: contents;
        }

        table.sub-table > thead > tr > th {
          grid-column: var(--full-width);
        }

        tr.step > td {
          grid-column: var(--full-width);
        }

        table.step-table {
          grid-template-columns: max-content max-content 1fr 1fr;
        }

        table.step-table tr.status td {
          padding: var(--v-pad) var(--h-pad);
          margin-top: var(--thin-v-pad);
          margin-bottom: var(--thin-v-pad);
        }

        span.status {
          text-align: center;
          line-height: 1rem;
          font-size: 0.9rem;
        }

        tr.ok span.status {
          content: "✅";
        }

        tr.err td.actual {
          background-color: #fcc;
        }

        tr.status td.expected {
          position: relative;
          color: #66f;
        }

        tr.status td.expected:hover:after {
          content: "expected";
          position: absolute;
          right: var(--h-pad);
          color: #33c;
        }

        tr.status td.expected:hover {
          font-weight: bold;
        }

        tr.status td.actual {
          position: relative;
          color: #f66;
        }

        tr.status td.actual:hover {
          font-weight: bold;
        }

        tr.status td.actual:hover:after {
          content: "actual";
          position: absolute;
          right: var(--h-pad);
          color: #c33;
        }

        tr.status td.expectation {
          background-color: #eee;
        }

        tbody.hide-passed tr.ok {
          display: none;
        }

        tr.ok td.actual {
          background-color: #efe;
          border-left: 1px solid #6c6;
          grid-column: 3 / span 2;
        }

        tr.ok td.expected {
          display: none;
        }

        tr.status > td:first-child {
          padding-left: 0.5rem;
          font-size: 0.8rem;
        }

        tr.status td:first-child {
          display: grid;
          align-items: center;
          grid-template-columns: max-content;
          background-color: transparent;
        }

        tr.status span.status {
          text-align: center;
          color: white;
          line-height: 1rem;
        }

        tr.err td.actual {
          background-color: #fcc;
        }

        tr.err td.expected {
          background-color: #ccf;
        }

        table {
          font-size: 0.9rem;
        }

        tr.status td.actual,
        tr.status td.expected {
          white-space: pre;
          font-family: monospace;
          line-height: 1.1rem;
        }

        form {
          padding: 1rem;
          border: 1px solid #999;
        }

        input[type="checkbox"] {
          display: inline-block;
          width: 1rem;
          height: 1rem;
          border: 1px solid #333;
          appearance: auto;
        }
      </style>
      <form>
        <label>
          <input type="checkbox" id="hide-passed" data-target="checkbox" />
          Hide passed
        </label>
      </form>
      <div class="summary">
        <div class="tests" data-target="summary">
          <p class="title">Tests</p>
        </div>
      </div>
      <table id="log" data-target="log">
        <tbody data-target></tbody>
      </table>
      <div id="test-content"></div>
    `;

    checkbox.addEventListener("click", () =>
      log.classList.toggle("hide-passed", checkbox.checked)
    );

    document.body.append(fragment);

    return new DOMReporter(target, summary);
  }

  #log: HTMLTableSectionElement;
  #summary: HTMLDivElement;

  constructor(log: HTMLTableSectionElement, summary: HTMLDivElement) {
    this.#log = log;
    this.#summary = summary;
  }

  module(module: ModuleResult): void {
    // if (module.status === "ok") {
    // } else {
    // }

    this.#summarize(module);

    for (let test of module.tests) {
      this.#test(test);
    }
  }

  #summarize = (module: ModuleResult) => {
    let {
      tests: { ok, err, skipped },
    } = summarize(module);

    let { fragment } = html`<p class="summary">
      <span class="ok">${String(ok)}</span>
      <span ${attr("class", `err ${err === 0 ? "none" : "some"}`)}
        >${String(err)}</span
      >
      ${If(
        skipped !== 0,
        html`<span class="skipped">${String(skipped)}</span>`
      )}
    </p>`;

    this.#summary.append(fragment);
  };

  #test = (test: TestResult): void => {
    if (test.status === "skipped") {
      return;
    }

    // if (test.status === "ok") {
    // } else if (test.status === "err") {
    // }

    let { target, fragment }: HtmlFragment<HTMLTableSectionElement> = html`
      <tr ${attr("class", `test ${test.status}`)} class="test">
        <td class="full">
          <table ${attr("class", `test sub-table ${test.status}`)}>
            <thead>
              <tr class="description">
                <th class="full">
                  ${Status(test.status)}<span>${test.name}</span>
                </th>
              </tr>
            </thead>
            <tbody data-target></tbody>
          </table>
        </td>
      </tr>
    `;

    for (let step of test.steps) {
      target.append(this.#step(step));
    }

    this.#log.append(fragment);
  };

  #step = (step: Step): DocumentFragment => {
    // if (step.status === "ok") {
    // } else if (step.status === "err") {
    // }

    let { fragment, target }: HtmlFragment<HTMLTableSectionElement> = html`
      <tr ${attr("class", `step ${step.status}`)}>
        <td class="full">
          <table class="step-table sub-table">
            ${If(
              step.desc !== "default",
              html`<thead>
                <tr class="description">
                  <th class="full">
                    ${step.status === "err" ? "❌" : ""}
                    <span class="title">${step.desc}</span>
                  </th>
                </tr>
              </thead>`
            )}
            <tbody data-target></tbody>
          </table>
        </td>
      </tr>
    `;

    for (let assertion of step.assertions) {
      target.append(this.#assertion(assertion));
    }

    return fragment;
  };

  #assertion = (assertion: Assertion): DocumentFragment => {
    let { status, expectation, actual } = assertion;
    let expected = assertion.status === "err" ? assertion.expected.print : "";

    let { fragment } = html`<tr ${attr("class", `${status} status`)}>
      <td>${Status(status)}</td>
      <td class="expectation">${expectation.print}</td>
      <td class="actual">${actual.print}</td>
      <td class="expected">${expected}</td>
    </tr>`;

    return fragment;
  };

  cleanup(): void {
    this.#log.remove();
  }
}

type IntoDynamicContent = string | DynamicContent;

function intoDynamicContent(into: IntoDynamicContent): DynamicContent {
  if (typeof into === "string") {
    return new DynamicStringContent(into);
  } else {
    return into;
  }
}

type DynamicContent =
  | DynamicStringContent
  | CondContent
  | HtmlFragment<Element | undefined>;

export class DynamicStringContent {
  constructor(readonly string: string) {}

  get node(): Node {
    return document.createTextNode(this.string);
  }
}

export class CondContent {
  static is(value: unknown): value is Attr {
    return isObject(value) && value instanceof CondContent;
  }

  constructor(
    readonly cond: boolean,
    readonly ifTrue: DynamicContent,
    readonly ifFalse?: DynamicContent
  ) {}

  get node(): Node | undefined {
    if (this.cond) {
      return this.ifTrue.node;
    } else if (this.ifFalse) {
      return this.ifFalse.node;
    } else {
      return;
    }
  }
}

export function If(
  cond: boolean,
  ifTrue: IntoDynamicContent,
  ifFalse?: IntoDynamicContent
): CondContent {
  return new CondContent(
    cond,
    intoDynamicContent(ifTrue),
    ifFalse ? intoDynamicContent(ifFalse) : undefined
  );
}

export class HtmlFragment<
  Target extends Element | undefined = undefined,
  Targets extends Record<string, Element> = {}
> {
  constructor(
    readonly fragment: DocumentFragment,
    readonly target: Target,
    readonly targets: Targets
  ) {}

  get node(): DocumentFragment {
    return this.fragment;
  }
}

export class Attr {
  static is(value: unknown): value is Attr {
    return isObject(value) && value instanceof Attr;
  }

  constructor(readonly name: string, readonly value: string) {}
}

export function attr(name: string, value: string): Attr {
  return new Attr(name, value);
}

export function html<
  T extends Element | undefined,
  Targets extends Record<string, Element>
>(
  literals: TemplateStringsArray,
  ...exprs: (IntoDynamicContent | Attr)[]
): HtmlFragment<T, Targets> {
  let body: string[] = [];

  let placeholders: Record<string, DynamicContent> = {};
  let placeholderAttrs: Record<string, Attr> = {};

  for (let [literal, i] of enumerate(literals)) {
    body.push(literal);

    if (exprs.length !== i) {
      let value = exprs[i];

      if (Attr.is(value)) {
        placeholderAttrs[String(i)] = value;
        body.push(` data-placeholder data-placeholder-${i}="" `);
      } else {
        placeholders[String(i)] = intoDynamicContent(value);
        body.push(`<script type="placeholder" id="${i}"></script>`);
      }
    }
  }

  let template = document.createElement("template");
  template.innerHTML = body.join("");
  let fragment = template.content;

  for (let placeholder of fragment.querySelectorAll(
    "script[type=placeholder]"
  )) {
    let dynamic = placeholders[placeholder.id];
    let content = dynamic.node;

    if (content) {
      placeholder.replaceWith(content);
    } else {
      placeholder.remove();
    }
  }

  for (let element of fragment.querySelectorAll("[data-placeholder]")) {
    element.removeAttribute("data-placeholder");
    let attrs = element.attributes;

    for (let attrNode of attrs) {
      let match = attrNode.localName.match(/^data-placeholder-(\d+)$/);

      if (match && match[1]) {
        let attr = placeholderAttrs[(match[1] as unknown) as number];
        element.removeAttributeNode(attrNode);
        element.setAttribute(attr.name, attr.value);
      }
    }
  }

  let defaultTarget = fragment.querySelector(`[data-target=""]`) as T;
  defaultTarget?.removeAttribute("data-target");
  let targetElements = fragment.querySelectorAll(
    `[data-target]:not([data-target=""])`
  );

  let targets: Record<string, Element> = {};

  for (let el of targetElements) {
    let id = el.getAttribute("data-target")!;
    el.removeAttribute("data-target");
    targets[id] = el;
  }

  return new HtmlFragment(fragment, defaultTarget, targets as Targets);
}

function Status(status: "ok" | "err") {
  return html`<span class="status">${status === "ok" ? "✅" : "❌"}</span>`;
}

interface Summary {
  tests: {
    ok: number;
    err: number;
    skipped: number;
  };
}

function summarize(module: ModuleResult): Summary {
  let ok = 0;
  let err = 0;
  let skipped = 0;

  for (let test of module.tests) {
    if (test.status === "ok") {
      ok++;
    } else if (test.status === "err") {
      err++;
    } else if (test.status === "skipped") {
      skipped++;
    } else {
      unreachable(`exhaustive`, test);
    }
  }

  return {
    tests: {
      ok,
      err,
      skipped,
    },
  };
}
