import { defDSL, fragment, html } from "@shimmer/dsl";
import SentMessageAvatar from "./avatar";
import SentMessageUsername from "./username";

export default defDSL(({ $ }) =>
  fragment(
    $(SentMessageAvatar),
    html.section(
      $(SentMessageUsername),
      html.p("Hey!"),
      html.p(
        "I love the ideas! I'm really excited about where this year's EmberConf is ",
        "going, I'm sure it's going to be the best one yet. Some quick notes:"
      ),
      html.ul(
        html.li(
          "Definitely agree that we should double the coffee budget this year (it ",
          "really is impressive how much we go through!)"
        ),
        html.li(
          "A blimp would definitely make the venue very easy to find, but I think ",
          "it might be a bit out of our budget. Maybe we could rent some spotlights ",
          "instead?"
        ),
        html.li(
          "We absolutely will need more hamster wheels, last year's line was ",
          html.em("way"),
          " too long. Will get on that now before rental season hits ",
          "its peak."
        )
      )
    )
  )
);
