import {
  component,
  ComponentData,
  Owner,
  Reactive,
} from "../../../../../src/index";
import Avatar from "../avatar";

interface ReceivedMessageData extends ComponentData {
  args: {
    title: Reactive<string>;
    initial: Reactive<string>;
    isActive: Reactive<boolean>;
  };
}

export default component<Owner, ReceivedMessageData>((owner: Owner) => () =>
  Avatar(owner)({
    args: {
      title: "Tomster's avatar",
      initial: "T",
      isActive: true,
    },
  })
);
