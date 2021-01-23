import { MDCTextField } from "@material/textfield";
import { def } from "@shimmer/dsl";
import type { Reactive } from "@shimmer/reactive";

export default def(({ label }: { label: Reactive<string> }) => (
  <div
    class="mdc-text-field mdc-text-field--filled food-field"
    use-effect={(element) => new MDCTextField(element)}
  >
    <span class="mdc-text-field__ripple"></span>
    <label id="food-input-id" class="mdc-floating-label">
      {label}
    </label>
    <input
      class="mdc-text-field__input"
      type="text"
      aria-labelledby="food-input-id"
    />
    <span class="mdc-line-ripple" />
  </div>
));
