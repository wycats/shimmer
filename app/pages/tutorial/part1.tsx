import { def } from "@shimmer/dsl";
import type { Block } from "@shimmer/reactive";
import { NavBar } from "../nav";
import { Page } from "../page";
import { SubNavBar } from "./subnav";

const Layout = def((_, { default: body }: { default: Block<[]> }) => (
  <>
    <NavBar />
    <SubNavBar />
    <div class="tutorial">{body.invoke([])}</div>
  </>
));

const Template = def(() => (
  <Layout>
    <div class="info">
      <a href="https://guides.emberjs.com/release/components/">
        Template are HTML
      </a>
    </div>
    <div class="messages">
      <aside>
        <div class="avatar is-active" title="Tomster's avatar">
          T
        </div>
      </aside>
      <section>
        <h4 class="username">
          Tomster <span class="local-time">their local time is 4:56pm</span>
        </h4>
        <p>
          Hey Zoey, have you had a chance to look at the EmberConf brainstorming
          doc I sent you?
        </p>
      </section>
      <aside class="current-user">
        <div class="avatar" title="Zoey's avatar">
          Z
        </div>
      </aside>
      <section>
        <h4 class="username">Zoey</h4>
        <p>Hey!</p>
        <p>
          I love the ideas! I'm really excited about where this year's EmberConf
          is going, I'm sure it's going to be the best one yet. Some quick
          notes:
        </p>
        <ul>
          <li>
            Definitely agree that we should double the coffee budget this year
            (it really is impressive how much we go through!)
          </li>
          <li>
            A blimp would definitely make the venue very easy to find, but I
            think it might be a bit out of our budget. Maybe we could rent some
            spotlights instead?
          </li>
          <li>
            We absolutely will need more hamster wheels, last year's line was{" "}
            <em>way</em> too long. Will get on that now before rental season
            hits its peak.
          </li>
        </ul>
      </section>
      <form>
        <input />
        <button type="submit">Send</button>
      </form>
    </div>
  </Layout>
));

export const Main = Page.of(() => <Template />);
