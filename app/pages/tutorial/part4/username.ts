import { component, Dict, Owner, Reactive, text } from "../../../../src/index";
import { Cond, el, ToBool } from "../../utils";

export default component(
  (owner: Owner) => ({
    name,
    localTime,
  }: Dict<{
    name: Reactive<string>;
    localTime: Reactive<string | undefined>;
  }>) =>
    el(
      "h4",
      { class: "username" },
      text(name),
      Cond(owner)(
        ToBool(localTime),
        el(
          "span",
          { class: "local-time" },
          text("their local time is "),
          text(localTime as Reactive<string>)
        )
      )
    )
);