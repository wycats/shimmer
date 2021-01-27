import { enumerate, isObject, unreachable } from "@shimmer/reactive";
import {
  Assertion,
  ModuleResult,
  Printable,
  PrintableRecord,
  Step,
  TestResult,
} from "./types";

export interface ReporterDefinition<T extends ReporterInstance> {
  begin(): T;
}

// export type ReporterDefinition<T extends ReporterInstance> = () => T;

export interface ReporterInstance {
  summarize(modules: ModuleResult[]): void;
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

  summarize(modules: ModuleResult[]): void {
    this.#reporter.summarize(modules);
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
      targets: { showPassedTests, showPassedExpectations, summary },
    }: HtmlFragment<
      HTMLUListElement,
      {
        showPassedTests: HTMLInputElement;
        showPassedExpectations: HTMLInputElement;
        showSkipped: HTMLInputElement;
        summary: HTMLDivElement;
      }
    > = html`
      <style>
        * {
          box-sizing: border-box;
        }

        :root {
          --ok-bg: #beb;
          --ok-fg: #363;

          --ok-divider: #9c9;
          --err-divider: #c99;

          --ok-actual-bg: #efe;
          --ok-actual-fg: #696;

          --ok-test-bg: #dfd;
          --ok-test-fg: #363;

          --err-expected-bg: #eef;
          --err-expected-fg: #669;
          --err-actual-bg: #fdd;
          --err-actual-fg: #966;
          --err-meta-bg: #ddd;
          --err-meta-fg: #666;

          --err-bg: #fcc;
          --err-fg: #633;

          --skipped-bg: #ccc;
          --skipped-fg: #666;

          --step-bg: #eef;
          --step-accent: #bbd;
          --step-fg: #669;

          --pad: var(--v-pad) var(--h-pad);
          --v-pad: 0.3rem;
          --thin-v-pad: 0.1rem;
          --h-pad: 0.2rem;
          --full-width: 1 / span 4;

          --dim: #999;
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

        label {
          cursor: pointer;
          display: flex;
          flex-wrap: wrap;
          gap: var(--h-pad);
        }

        div.summary {
          display: grid;
          padding: var(--pad);
          margin: var(--pad);
          border: 1px solid #333;
          grid-template-columns: max-content max-content max-content max-content;
          column-gap: 1rem;
        }

        span.title {
          grid-column-start: 1;
        }

        div.summary > span {
          color: gray;
        }

        div.summary > .skipped {
          color: #ca0;
          font-weight: bold;
        }

        div.summary > .ok {
          color: green;
          font-weight: bold;
        }

        div.summary > .err.some {
          color: red;
          font-weight: bold;
        }

        div.summary > .ok:before {
          content: "✔ ";
        }

        div.summary > .err:before {
          content: "✖ ";
        }

        ul {
          list-style-type: none;
        }

        /** generic */

        .row {
          display: grid;
          grid-auto-flow: column;
        }

        .row.align-items\\:top {
          align-items: stretch;
        }

        .row.align-items\\:top > * {
          display: grid;
          align-items: start;
        }

        .row > * {
          padding-top: var(--v-pad);
        }

        .stack > * + * {
          margin-top: var(--v-pad);
        }

        .with-annotation {
          display: grid;
          grid-template: "annotation annotated" / max-content 1fr;
        }

        .with-annotation.gap {
          gap: var(--h-pad);
        }

        .with-annotation > .annotation {
          grid-area: annotation;
        }

        .with-annotation > :not(.annotation) {
          grid-area: annotated;
        }

        .with-sidebar {
          display: flex;
          flex-wrap: wrap;
          gap: var(--h-pad);
        }

        .with-sidebar > .sidebar {
          flex-basis: 20rem;
          flex-grow: 1;
        }

        .with-sidebar > :not(.sidebar) {
          flex-basis: 0;
          flex-grow: 999;
          min-width: calc(50% - 1rem);
        }

        .pad-items\\:horizontal > *,
        .pad-items\\:horizontal:before,
        .pad-items\\:horizontal:after {
          padding-left: var(--h-pad);
          padding-right: var(--h-pad);
        }

        .pad-items\\:vertical > *,
        .pad-items\\:vertical:before,
        .pad-items\\:vertical:after {
          padding-top: var(--v-pad);
          padding-bottom: var(--v-pad);
        }

        .cluster {
          display: flex;
          flex-wrap: wrap;
          align-items: stretch;
        }

        .display\\:flex {
          display: flex;
        }

        .gap\\:normal {
          gap: var(--h-pad);
        }

        /** end generic */

        /** app generic */

        /* padding is for inline content */
        .padding\\:horizontal {
          padding-left: var(--h-pad);
          padding-right: var(--h-pad);
        }

        .padding\\:vertical {
          padding-top: var(--v-pad);
          padding-bottom: var(--v-pad);
        }

        .fill\\:horizontal {
          flex-grow: 1;
        }

        /** end app generic */

        .toggle-passed-expectations {
          display: none;
        }

        .show-passed-tests .toggle-passed-expectations {
          display: flex;
        }

        :is(.test.ok .steps, .test.ok, .test.skipped) {
          display: none;
        }

        .show-skipped .test.skipped {
          display: list-item;
        }

        .test.ok .steps {
          display: none;
        }

        .show-passed-tests .test.ok {
          display: block;
        }

        .show-passed-expectations .test.ok .steps {
          display: block;
        }

        li.step > ul.stack:first-child {
          margin-left: 0;
        }

        li.step > h3 > span.title:before {
          content: "step";
          font-size: 80%;
          font-style: italic;
        }

        li.test > h2 > span.title:before {
          content: "test";
          font-size: 80%;
          font-style: italic;
        }

        ul.stack {
          margin-left: 0.5rem;
        }

        .cluster.center\\:vertical > * {
          display: flex;
          align-items: center;
        }

        .cluster > .fit {
          width: max-content;
        }

        li.module h1 span.desc {
          font-weight: bold;
        }

        span.test-count {
          font-size: 80%;
          color: var(--dim);
        }

        li.ok .expectation {
          border-right: 1px solid var(--ok-divider);
        }

        li.err .expectation {
          border-right: 1px solid var(--err-divider);
        }

        li.actual,
        li.expected,
        li.error-info,
        li.error-metadata {
          font-family: monospace;
        }

        .multiline {
          margin-left: 1rem;
        }

        :is(li.error-info, li.error-metadata) :is(ul, li) {
          display: block;
        }

        h1,
        h2,
        h3,
        h4,
        h5,
        h6 {
          padding: var(--pad);
        }

        li.ok > h1 {
          background-color: var(--ok-bg);
        }

        li.err > h1 {
          background-color: var(--err-bg);
        }

        li.ok > h2 {
          background-color: var(--ok-test-bg);
        }

        li.err > h2 {
          background-color: var(--err-test-bg);
        }

        li.ok > :is(h3, h4, h5, h6) {
          background-color: var(--ok-actual-bg);
          color: var(--ok-fg);
        }

        li.ok > ul > li.actual {
          background-color: var(--ok-actual-bg);
          color: var(--ok-actual-fg);
        }

        li.err > :is(h3, h4, h5, h6) {
          background-color: var(--err-actual-bg);
          color: var(--err-fg);
        }

        li.skipped > :is(h1, h2, h3, h4, h5, h6) {
          background-color: var(--skipped-bg);
          color: var(--skipped-fg);
        }

        li.ok > ul > li.actual {
          background-color: var(--ok-actual-bg);
          color: var(--ok-actual-fg);
        }

        :is(li.ok, li.err) > ul > li {
          position: relative;
        }

        :is(li.actual, li.expected):hover:after {
          content: attr(aria-label);
          position: absolute;
          right: var(--h-pad);
          font-weight: bold;
        }

        li.err > ul > li.error-info {
          background-color: var(--err-actual-bg);
          color: var(--err-actual-fg);
        }

        li.err > ul > li.error-metadata {
          background-color: var(--err-meta-bg);
          color: var(--err-meta-fg);
        }

        li.err > ul > li.actual {
          background-color: var(--err-actual-bg);
          color: var(--err-actual-fg);
        }

        li.err > ul > li.expected {
          background-color: var(--err-expected-bg);
          color: var(--err-expected-fg);
        }

        li.step.ok > :is(h1, h2, h3, h4, h5, h6) {
          background-color: var(--step-bg);
          color: var(--step-fg);
        }

        li.ok > ul > li.expectation {
          background-color: var(--ok-actual-bg);
          color: var(--ok-actual-fg);
        }

        li.err > ul > li.expectation {
          background-color: var(--err-bg);
          color: var(--err-fg);
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
      <form class="cluster">
        ${Labeled(
          "Show passed tests",
          { input: "left", class: "toggle-passed-tests" },
          html`<input type="checkbox" data-target="showPassedTests" />`
        )}
        ${Labeled(
          "Show passed expectations",
          { input: "left", class: "toggle-passed-expectations" },
          html`<input type="checkbox" data-target="showPassedExpectations" />`
        )}
      </form>
      <div class="summary" data-target="summary"></div>
      <ul id="log" class="stack" data-target></ul>
      <div id="test-content"></div>
    `;

    showPassedTests.addEventListener("input", () =>
      document.body.classList.toggle(
        "show-passed-tests",
        showPassedTests.checked
      )
    );

    showPassedExpectations.addEventListener("input", () =>
      document.body.classList.toggle(
        "show-passed-expectations",
        showPassedExpectations.checked
      )
    );

    document.body.append(fragment);

    return new DOMReporter(target, summary);
  }

  #log: HTMLUListElement;
  #summary: HTMLDivElement;

  constructor(log: HTMLUListElement, summary: HTMLDivElement) {
    this.#log = log;
    this.#summary = summary;
  }

  summarize(modules: ModuleResult[]): void {
    let showSkipped = this.#summarize(modules);

    if (showSkipped) {
      showSkipped.addEventListener("input", () =>
        document.body.classList.toggle("show-skipped", showSkipped.checked)
      );
    }
  }

  module(module: ModuleResult): void {
    let { target, fragment }: HtmlFragment<HTMLTableSectionElement> = html`
      <li ${attr("class", `module stack ${statusClass(module.status)}`)}>
        <h1 ${attr("class", ROW)}>
          ${Status(module.status)}<span class="desc">[${module.desc}]</span>
          <span class="test-count" title="count"
            >${Count(
              module.tests,
              (test) => (test.status === "skipped" ? 0 : test.metadata.elapsed),
              "test"
            )}</span
          >
        </h1>
        <ul class="tests stack" data-target></ul>
      </li>
    `;

    this.#log.append(fragment);

    for (let test of module.tests) {
      this.#test(test, target);
    }
  }

  #summarize = (moduleList: ModuleResult[]) => {
    let { tests, modules, expectations } = summarize(moduleList);

    let {
      fragment,
      targets: { showSkipped },
    }: HtmlFragment<undefined, { showSkipped: HTMLInputElement }> = html`
      ${this.#summaryLine("Modules", modules)}
      ${this.#summaryLine("Tests", tests)}
      ${this.#summaryLine("Expectations", expectations)}
    `;

    this.#summary.append(fragment);
    return showSkipped;
  };

  #summaryLine = (title: string, line: SummaryLine) => {
    return html`
      <span class="title cluster pad-items:horizontal">${title}</span>
      <span class="ok">${String(line.ok)}</span>
      <span ${attr("class", `err ${line.err === 0 ? "none" : "some"}`)}
        >${String(line.err)}</span
      >
      ${If(
        line.skipped !== 0,
        html`<span class="skipped cluster pad-items:horizontal center:vertical"
          >${String(line.skipped)} skipped
          <label>
            (<input
              type="checkbox"
              id="show-skipped"
              data-target="showSkipped"
            />show)
          </label>
        </span>`
      )}
    `;
  };

  #test = (test: TestResult, into: HTMLTableSectionElement): void => {
    let { target, fragment }: HtmlFragment<HTMLTableSectionElement> = html`
      <li ${attr("class", `test stack ${statusClass(test.status)}`)}>
        <h2 ${attr("class", ROW)}>
          ${Status(test.status)}<span class="title cluster pad-items:horizontal"
            >${test.name}</span
          >${test.status === "skipped"
            ? null
            : html`<span class="test-count"
                >${formatMs(test.metadata.elapsed)}</span
              >`}
        </h2>
        <ul class="steps stack" data-target></ul>
      </li>
    `;

    into.append(fragment);

    if (test.status !== "skipped") {
      for (let step of test.steps) {
        target.append(this.#step(step));
      }
    }

    this.#log.append(fragment);
  };

  #step = (step: Step): DocumentFragment => {
    let { fragment, target }: HtmlFragment<HTMLTableSectionElement> = html`
      <li ${attr("class", `step ${step.status}`)}>
        ${If(
          step.desc !== "default",
          html`
            <h3 ${attr("class", ROW)}>
              ${step.status === "err" ? "❌" : ""}
              <span class="title cluster pad-items:horizontal"
                >${step.desc}</span
              >
            </h3>
          `
        )}
        <ul class="assertions stack" data-target></ul>
      </li>
    `;

    for (let assertion of step.assertions) {
      target.append(this.#assertion(assertion).fragment);
    }

    return fragment;
  };

  #assertion = (assertion: Assertion): HtmlFragment => {
    let { status, expectation } = assertion;

    if (assertion.status === "ok") {
      let { actual } = assertion;

      return html`<li
        ${attr("class", `${statusClass(status)} with-annotation assertion`)}
      >
        <h4 class="annotation">${Status(status)}</h4>

        <ul ${attr("class", ROW)}>
          <li class="expectation fit" title="expectation">
            <span>${expectation.print}</span>
          </li>
          <li class="actual fill:horizontal" aria-label="actual">
            <span>${actual.print}</span>
          </li>
        </ul>
      </li> `;
    } else if (assertion.status === "err:eq") {
      let expected = assertion.expected.print;
      let { actual } = assertion;

      return html`<li
        ${attr("class", `${statusClass(status)} with-annotation assertion`)}
      >
        <h4 class="annotation">${Status(status)}</h4>

        <ul ${attr("class", ROW)}>
          <li class="expectation fit" title="expectation">
            <span>${expectation.print}</span>
          </li>
          <li class="actual fill:horizontal" aria-label="actual">
            <span>${actual.print}</span>
          </li>
          <li class="expected fill:horizontal" aria-label="expected">
            <span>${expected}</span>
          </li>
        </ul>
      </li> `;
    } else if (assertion.status === "err:ok") {
      let { error, metadata } = assertion;

      return html`<li
        ${attr("class", `${statusClass(status)} with-annotation assertion`)}
      >
        <h4 class="annotation">${Status(status)}</h4>

        <ul class="row pad-items:horizontal pad-items:vertical align-items:top">
          <li class="expectation fit" title="expectation">
            <span>${expectation.print}</span>
          </li>
          <li class="error-info list stack fill:horizontal" aria-label="error">
            ${PrintRecord(error)}
          </li>
          ${If(
            metadata !== undefined,
            () => html`
              <li
                class="error-metadata list stack fill:horizontal"
                aria-label="metadata"
              >
                ${PrintRecord(metadata || null)}
              </li>
            `
          )}
        </ul>
      </li> `;
    } else {
      unreachable(`exhaustive`, assertion);
    }
  };

  cleanup(): void {
    this.#log.remove();
  }
}

function PrintRecord(record: PrintableRecord | null): DynamicContent {
  if (record === null) {
    return html`null`;
  }

  return Map(Object.entries(record), ([k, value]) => {
    if (Printable.is(value)) {
      let v = value.print;
      if (v.includes("\n")) {
        return html`
          <p>${formatKey(k)}:</p>
          <div class="multiline">${v}</div>
        `;
      } else {
        return html`<div>${formatKey(k)}: ${value.print}</div>`;
      }
    } else {
      if (Object.entries(value).length === 0) {
        return html`<p>${formatKey(k)}: {}</p>`;
      }

      return html`
        <p>${formatKey(k)}:</p>
        <div class="multiline">${PrintRecord(value)}</div>
      `;
    }
  });
}

function formatKey(key: string) {
  if (key.match(/^\p{XID_Start}\p{XID_Continue}*$/u)) {
    return key;
  } else {
    return JSON.stringify(key);
  }
}

interface Pluralize {
  zero: string;
  one: string;
  two: string;
  few: (count: number) => string;
  many: (count: number) => string;
  other: (count: number) => string;
}

interface MinPluralize {
  zero: string;
  one: string;
  multiple: (count: number) => string;
}

const INFLECT: { test: MinPluralize } = {
  test: {
    zero: "no tests",
    one: "one test",
    multiple: (count: number) => `${count} tests`,
  },
};

type INFLECT = typeof INFLECT;

function normalizePlurals(
  plurals: Pluralize | MinPluralize | keyof INFLECT
): Pluralize {
  if (typeof plurals === "string") {
    return normalizePlurals(INFLECT[plurals]);
  } else if ("multiple" in plurals) {
    return {
      zero: plurals.zero,
      one: plurals.one,
      two: plurals.multiple(2),
      few: plurals.multiple,
      many: plurals.multiple,
      other: plurals.multiple,
    };
  } else {
    return plurals;
  }
}

function Count<T>(
  items: T[] | readonly T[],
  elapsed: (value: T) => number,
  definition: Pluralize | MinPluralize | keyof INFLECT
) {
  let sum = 0;

  for (let item of items) {
    sum += elapsed(item);
  }

  return `${count(items, definition)}, ${formatMs(sum)}`;
}

function formatMs(duration: number): string {
  return `${Math.round(duration)}ms`;
}

function elapsed<T>(items: T[] | readonly T[], elapsed: (value: T) => number) {
  let sum = 0;

  for (let item of items) {
    sum += elapsed(item);
  }

  return formatMs(sum);
}

function count(
  items: unknown[] | readonly unknown[],
  definition: Pluralize | MinPluralize | keyof INFLECT
) {
  let rules = new Intl.PluralRules();
  let count = items.length;
  let plurals = normalizePlurals(definition);

  switch (rules.select(count)) {
    case "zero": {
      return plurals.zero;
    }
    case "one": {
      return plurals.one;
    }
    case "two": {
      return plurals.two;
    }
    case "few": {
      return plurals.few(count);
    }
    case "many": {
      return plurals.many(count);
    }
    case "other": {
      return plurals.other(count);
    }
  }
}

type IntoDynamicContent =
  | null
  | string
  | DynamicContent
  | (() => DynamicContent);

function intoDynamicContent(into: IntoDynamicContent): DynamicContent | null {
  if (typeof into === "string") {
    return new DynamicStringContent(into);
  } else if (typeof into === "function") {
    return into();
  } else {
    return into;
  }
}

const ROW = `cluster center:vertical pad-items:horizontal`;

type DynamicContent =
  | DynamicStringContent
  | CondContent
  | MapContent
  | HtmlFragment<Element | undefined>;

export class DynamicStringContent {
  constructor(readonly string: string) {}

  get node(): Node {
    return document.createTextNode(this.string);
  }
}

export class CondContent {
  constructor(
    readonly cond: boolean,
    readonly ifTrue: DynamicContent | null,
    readonly ifFalse?: DynamicContent | null
  ) {}

  get node(): Node | undefined {
    if (this.cond) {
      return this.ifTrue ? this.ifTrue.node : undefined;
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

export class MapContent {
  constructor(
    readonly iterable: Iterable<unknown>,
    readonly callback: (value: unknown) => HtmlFragment
  ) {}

  get node(): Node | undefined {
    let frag = document.createDocumentFragment();
    let { callback, iterable } = this;

    for (let item of iterable) {
      frag.append(callback(item).fragment);
    }

    return frag;
  }
}

export function Map<T>(
  iterable: Iterable<T>,
  callback: (value: T) => HtmlFragment
): MapContent {
  return new MapContent(iterable, callback as (value: unknown) => HtmlFragment);
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
        let content = intoDynamicContent(value);

        if (content !== null) {
          placeholders[String(i)] = content;
          body.push(`<script type="placeholder" id="${i}"></script>`);
        }
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
    targets[id] = el;
  }

  return new HtmlFragment(fragment, defaultTarget, targets as Targets);
}

function statusClass(status: "ok" | "err:eq" | "err:ok" | "err" | "skipped") {
  switch (status) {
    case "err:eq":
    case "err:ok":
    case "err":
      return "err";
    default:
      return status;
  }
}

function Status(status: "ok" | "err:eq" | "err:ok" | "err" | "skipped") {
  let icon;

  switch (status) {
    case "ok":
      icon = "✔️";
      break;
    case "err:eq":
    case "err:ok":
    case "err":
      icon = "✖️";
      break;
    case "skipped":
      icon = "⏭️";
      break;
  }

  return html`<span class="status">${icon}</span>`;
}

function Labeled(
  label: string,
  { input, class: className }: { input: "right" | "left"; class?: string },
  body: HtmlFragment
) {
  let defaultClasses = `input cluster center:vertical pad-items:horizontal`;

  let classAttr = className
    ? attr("class", `${defaultClasses} ${className}`)
    : attr("class", defaultClasses);

  if (input === "right") {
    return html`<label ${classAttr}
      ><span>${label}</span><span>${body}</span></label
    >`;
  } else {
    return html`<label ${classAttr}
      ><span>${body}</span><span>${label}</span></label
    >`;
  }
}

interface SummaryLine {
  ok: number;
  err: number;
  skipped: number;
}

interface Summary {
  modules: SummaryLine;
  tests: SummaryLine;
  expectations: SummaryLine;
  elapsed: number;
}

function summarize(modules: ModuleResult[]): Summary {
  let okExpectations = 0;
  let errExpectations = 0;
  let skippedExpectations = 0;

  let okTests = 0;
  let errTests = 0;
  let skippedTests = 0;

  let okModules = 0;
  let errModules = 0;

  let totalElapsed = 0;

  for (let module of modules) {
    switch (module.status) {
      case "ok": {
        okModules++;
        break;
      }

      case "err": {
        errModules++;
        break;
      }

      default: {
        unreachable(`exhaustive`, module);
      }
    }

    for (let test of module.tests) {
      if (test.status === "ok" || test.status === "err") {
        let elapsed = test.metadata.elapsed;
        totalElapsed += elapsed;
      }

      if (test.status === "ok") {
        okTests++;
      } else if (test.status === "err") {
        errTests++;
      } else if (test.status === "skipped") {
        skippedTests++;
      } else {
        unreachable(`exhaustive`, test);
      }

      if (test.status !== "skipped") {
        for (let step of test.steps) {
          for (let assertion of step.assertions) {
            switch (assertion.status) {
              case "ok": {
                okExpectations++;
                break;
              }
              case "err:ok":
              case "err:eq": {
                errExpectations++;
                break;
              }
              default:
                unreachable(`exhaustive`, assertion);
            }
          }
        }
      }
    }
  }

  return {
    elapsed: totalElapsed,
    tests: {
      ok: okTests,
      err: errTests,
      skipped: skippedTests,
    },
    modules: {
      ok: okModules,
      err: errModules,
      skipped: 0,
    },
    expectations: {
      ok: okExpectations,
      err: errExpectations,
      skipped: skippedExpectations,
    },
  };
}
