import { MDCRipple } from "@material/ripple";
import { def } from "@shimmer/dsl";
import type { Reactive } from "@shimmer/reactive";

// export const dslButton = def(
//   ({ args }: { args: { text: Reactive<string> } }) => {
//     let button = html.button[".mdc-button.mdc-button--outlined.eat-button"](
//       [effect((element) => new MDCRipple(element))],
//       html.span[".mdc-button__ripple"](),
//       html.span[".mdc-button__label"](args.text)
//     );

//     console.log("dsl button", button);

//     return button;
//   }
// );

export default def((args: { text: Reactive<string> }) => (
  <button
    class="mdc-button mdc-button--outlined eat-button"
    use-effect={(element) => new MDCRipple(element)}
  >
    <span class="mdc-button__ripple" />
    <span class="mdc-button__label">{args.text}</span>
  </button>
));

// export default jsxButton;
