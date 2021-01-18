import {
  App,
  component,
  fragment,
  Owner,
  Services,
  text,
} from "../../../src/index";
import { Nav } from "../nav";
import { page, PageHooks, RenderOptions, StaticOptions } from "../page";
import { el } from "../utils";
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

    return doc.render(Template(owner)(), cursor);
  }
}

export const Main = page(() => new TutorialPage());

const Template = component((owner: Owner) => () => {
  return fragment(
    Nav(owner)(),
    SubNav(owner)(),
    el("div", { class: "tutorial" }, Page(owner)())
  );
});

const Page = component((_owner: Owner) => () => {
  return fragment(
    el(
      "div",
      { class: "info" },
      el(
        "a",
        { href: "https://guides.emberjs.com/release/components/" },
        text("Templates are HTML")
      )
    ),

    el(
      "div",
      { class: "messages" },
      el(
        "aside",
        el(
          "div",
          { class: "avatar is-active", title: "Tomster's avatar" },
          text("T")
        )
      ),
      el(
        "section",
        el(
          "h4",
          { class: "username" },
          text("Tomster"),
          el(
            "span",
            { class: "local-time" },
            text("their local time is 4:56pm")
          )
        ),
        el(
          "p",
          text(
            "Hey Zoey, have you had a chance to look at the EmberConf brainstorming doc I sent you?"
          )
        )
      ),
      el(
        "aside",
        { class: "current-user" },
        el("div", { class: "avatar", title: "Zoey's avatar" }, text("Z"))
      ),
      el(
        "section",
        el("h4", { class: "username" }, text("Zoey")),
        el("p", text("Hey!")),
        el(
          "p",
          text(
            "I love the ideas! I'm really excited about where this year's EmberConf is "
          ),
          text(
            "going, I'm sure it's going to be the best one yet. Some quick notes:"
          )
        ),
        el(
          "ul",
          el(
            "li",
            text(
              "Definitely agree that we should double the coffee budget this year (it "
            ),
            text("really is impressive how much we go through!)")
          ),
          el(
            "li",
            text(
              "A blimp would definitely make the venue very easy to find, but I think "
            ),
            text(
              "it might be a bit out of our budget. Maybe we could rent some spotlights "
            ),
            text("instead?")
          ),
          el(
            "li",
            text(
              "We absolutely will need more hamster wheels, last year's line was "
            ),
            el("em", text("way")),
            text(" too long. Will get on that now before rental season hits "),
            text("its peak.")
          )
        )
      ),
      el("form", el("input"), el("button", { type: "submit" }, text("Send")))
    )
  );

  // Original:
  //
  // <div class="messages">
  //   <aside>
  //     <div class="avatar is-active" title="Tomster's avatar">T</div>
  //   </aside>
  //   <section>
  //     <h4 class="username">
  //       Tomster
  //       <span class="local-time">their local time is 4:56pm</span>
  //     </h4>

  //     <p>
  //       Hey Zoey, have you had a chance to look at the EmberConf brainstorming doc
  //       I sent you?
  //     </p>
  //   </section>

  //   <aside class="current-user">
  //     <div class="avatar" title="Zoey's avatar">Z</div>
  //   </aside>
  //   <section>
  //     <h4 class="username">Zoey</h4>

  //     <p>Hey!</p>

  //     <p>
  //       I love the ideas! I'm really excited about where this year's EmberConf is
  //       going, I'm sure it's going to be the best one yet. Some quick notes:
  //     </p>

  //     <ul>
  //       <li>
  //         Definitely agree that we should double the coffee budget this year (it
  //         really is impressive how much we go through!)
  //       </li>
  //       <li>
  //         A blimp would definitely make the venue very easy to find, but I think
  //         it might be a bit out of our budget. Maybe we could rent some spotlights
  //         instead?
  //       </li>
  //       <li>
  //         We absolutely will need more hamster wheels, last year's line was
  //         <em>way</em> too long. Will get on that now before rental season hits
  //         its peak.
  //       </li>
  //     </ul>

  //     <p>Let me know when you've nailed down the dates!</p>
  //   </section>

  //   <form>
  //     <input />
  //     <button type="submit">
  //       Send
  //     </button>
  //   </form>
  // </div>
});
