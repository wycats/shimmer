// import { Content, Doc, GLIMMER } from "@shimmer/core";
// import { Cursor } from "@shimmer/dom";

// interface Step {
//   desc: string;
//   update: () => void;
//   expect: string;
// }

// export class TestContext {
//   constructor(
//     readonly content: HTMLDivElement,
//     readonly log: HTMLTableElement
//   ) {}

//   async inur(
//     content: Content,
//     initial: string,
//     ...steps: Step[]
//   ): Promise<void> {
//     let app = Doc.of(document).render(content, Cursor.appending(this.content));
//     GLIMMER.render(app);

//     this.step("initial render");
//     this.assert(initial);

//     for (let step of steps) {
//       this.step(step.desc);
//       await step.update();
//       this.assert(step.expect);
//     }
//   }

//   render(content: Content, assertions: () => void): void {
//     let app = Doc.of(document).render(content, Cursor.appending(this.content));
//     GLIMMER.render(app);
//     assertions();
//   }

//   async update(callback: () => void, assertions: () => void): Promise<void> {
//     callback();
//     await GLIMMER.wait();
//     assertions();
//   }

//   step(desc: string): void {
//     let f = frag(`<tr class="step"><td colspan="4"></td></tr>`);

//     f.querySelector("td")!.innerText = desc;
//     this.log.append(f);
//   }

//   assert(expected: string): void {
//     let actual = this.content.innerHTML;

//     if (expected === actual) {
//       this.#log("ok", "rendered body was", actual);
//     } else {
//       this.#log("err", "rendered body was", actual, expected);
//     }
//   }

//   test(name: string): HTMLTableRowElement {
//     this.log.append(
//       frag(`
//         <tr class="test">
//           <td colspan="4">${name}</td>
//         </tr>
//       `)
//     );

//     return this.log.lastChild as HTMLTableRowElement;
//   }

//   #log = (
//     status: string,
//     expectation: string,
//     actual: string,
//     expected?: string
//   ): void => {
//     let f = frag(
//       `<tr class="${status} status">
//         <td><span class="status">${status}</span></td>
//         <td class="expectation">${expectation}</td>
//         <td class="actual">${actual}</td>
//         <td class="expected">${expected || ""}</td>
//       </tr>`
//     );

//     (f.querySelector("td.actual") as HTMLElement).innerText = actual;
//     (f.querySelector("td.expected") as HTMLElement).innerText = expected || "";

//     this.log.append(f);
//   };
// }

// export async function main(): Promise<void> {
//   let f = frag(`
//     <style>
//       * {
//         box-sizing: border-box;
//       }

//       p, div, span, table, tbody, td, tr, th, thead {
//         margin: unset;
//         padding: unset;
//       }

//       table {
//         width: 100%;
//         display: grid;
//         grid-template-columns: max-content max-content 1fr 1fr;
//         grid-auto-rows: 2rem;
//         align-items: center;
//       }

//       thead, tbody, tr {
//         display: contents;
//       }

//       th {
//         font-weight: bold;
//         color: #666;
//       }

//       td, th {
//         padding: 1rem;
//         height: 1.3rem;
//         line-height: 1.3rem;
//       }

//       tr.header td.expected {
//         font-weight: bold;
//         color: #66f;
//       }

//       tr.header td.actual {
//         font-weight: bold;
//         color: #f66;
//       }


//       tr.step td {
//         background-color: #ddd;
//         color: #666;
//         padding-left: 0.5rem;
//       }

//       tr.step td:before {
//         content: "step ";
//         font-weight: bold;
//       }

//       tr.status td.expectation {
//         background-color: #eee;
//       }

//       tbody.hide-passed tr.ok {
//         display: none;
//       }

//       tr.ok td.actual {
//         background-color: #efe;
//         border-left: 1px solid #6c6;
//         grid-column: 3 / span 2;
//       }

//       tr.ok td.expected {
//         display: none;
//       }

//       tr.status > td:first-child {
//         padding-left: 0.5rem;
//         font-size: 0.8rem;
//       }

//       tr.status td:first-child {
//         display: grid;
//         align-items: center;
//         grid-template-columns: max-content;
//         background-color: transparent;
//       }

//       tr.status span.status {
//         border-radius: 0.2rem;
//         padding: 0.1rem 0.3rem;
//         text-align: center;
//         color: white;
//         line-height: 1rem;
//       }

//       tr.ok span.status {
//         background-color: #9c9;
//       }

//       tr.err span.status {
//         background-color: #c99;
//       }

//       tr.err td.actual {
//         background-color: #fcc;
//       }

//       tr.err td.expected {
//         background-color: #ccf;
//       }

//       tr td, tr th {
//         padding: 0.2rem;
//       }

//       tr.test td {
//         background-color: #aaf;
//         color: #006;
//       }

//       table {
//         font-size: 0.9rem;
//       }

//       tr.test td, tr.step td {
//         grid-column: 1 / span 4;
//       }

//       tr.status td.actual, tr.status td.expected {
//         white-space: pre;
//         font-family: monospace;
//       }

//       form {
//         padding: 1rem;
//         border: 1px solid #999;
//       }

//       input[type=checkbox] {
//         display: inline-block;
//         width: 1rem;
//         height: 1rem;
//         border: 1px solid #333;
//         appearance: auto;
//       }
//     </style>
//     <form>
//       <label>
//         <input type="checkbox" id="hide-passed">
//         Hide passed
//       </label>
//     </form>
//     <table>
//       <tbody id="log">
//         <tr class="header">
//           <td>status</td>
//           <td class="expectation">expectation</td>
//           <td class="actual">actual</td>
//           <td class="expected">expected</td>
//         </tr>
//       </tbody>
//     </table>
//     <div id="test-content"></div>
//   `);

//   let hidePassed = f.querySelector("#hide-passed") as HTMLInputElement;
//   let content = f.querySelector("#test-content") as HTMLDivElement;
//   let log = f.querySelector("#log") as HTMLTableElement;

//   hidePassed.addEventListener("input", () => {
//     log.classList.toggle("hide-passed", hidePassed.checked);
//   });

//   document.body.append(f);

//   let ctx = new TestContext(content, log);

//   for (let test of TESTS) {
//     ctx.test(test.message);
//     await test.callback(ctx);
//     content.innerHTML = "";
//   }
// }

// export type TestFunction = (context: TestContext) => void | Promise<void>;

// export interface Test {
//   message: string;
//   callback: TestFunction;
// }

// const TESTS: Test[] = [];

// export function test(message: string, callback: TestFunction): void {
//   TESTS.push({ message, callback });
// }

// // Promise.resolve().then(main);

// function frag(body: string): DocumentFragment {
//   let template = document.createElement("template");
//   template.innerHTML = body;
//   return template.content;
// }
export { };

