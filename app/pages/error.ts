import {
  App,
  component,
  fragment,
  Owner,
  Services,
  text,
} from "../../src/index";
import { Nav } from "./nav";
import { page, PageHooks, RenderOptions, StaticOptions } from "./page";
import { el } from "./utils";

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

    return doc.render(Template(owner)(), cursor);
  }
}

export const Main = page(() => new TutorialPage());

const Template = component((owner: Owner) => () => {
  return fragment(Nav(owner)(), el("div", { class: "error" }, Page(owner)()));
});

const Page = component((_owner: Owner) => () =>
  fragment(text("An error occurred"))
);
