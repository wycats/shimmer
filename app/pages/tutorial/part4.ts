import type { App, Owner, Services } from "@shimmer/core";
import { defDSL, fragment, text } from "@shimmer/dsl";
import { Nav } from "../nav";
import { page, PageHooks, RenderOptions, StaticOptions } from "../page";
import { el } from "../utils";
import NewMessageInput from "./part4/new-message-input";
import ReceivedMessage from "./part4/received-message";
import SentMessage from "./part4/sent-message";
import { SubNav } from "./subnav";

interface TutorialState {}

export class TutorialPage implements PageHooks<TutorialState> {
  construct(_owner: Owner<Services>): TutorialState {
    return {};
  }
  render(
    _state: TutorialState,
    { owner }: StaticOptions,
    { cursor }: RenderOptions
  ): App {
    let doc = owner.service("doc");

    return doc.render(Template(undefined, owner.$), cursor);
  }
}

export const Main = page(() => new TutorialPage());

const Template = defDSL(({ $ }) => {
  return fragment($(Nav), $(SubNav), el("div", { class: "tutorial" }, $(Page)));
});

const Page = defDSL(({ $ }) => {
  return fragment(
    el(
      "div",
      { class: "info" },
      el(
        "a",
        {
          href: "https://guides.emberjs.com/release/components/block-content/",
        },
        text("Block Content")
      )
    ),
    el(
      "div",
      { class: "messages" },
      $(ReceivedMessage),
      $(SentMessage),
      $(NewMessageInput)
    )
  );
});
