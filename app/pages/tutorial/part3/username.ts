import { component, Owner, Reactive, text } from "../../../../src/index";
import { Cond, el, ToBool } from "../../utils";

export default component(
  (owner: Owner) => ({
    args: { name, localTime },
  }: {
    args: {
      name: Reactive<string>;
      localTime: Reactive<string | undefined>;
    };
  }) => {
    return el(
      "h4",
      { class: "username" },
      text(name),
      Cond(owner)({
        args: {
          bool: ToBool(localTime),
        },
        blocks: {
          ifTrue: el(
            "span",
            { class: "local-time" },
            text("their local time is "),
            text(localTime as Reactive<string>)
          ),
        },
      })
    );
  }
);
