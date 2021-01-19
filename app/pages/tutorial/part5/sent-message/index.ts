import { def, fragment, text } from "../../../../../src/index";
import { el } from "../../../utils";
import Message from "../message";

export default def(
  ({ $ }) =>
    $(Message, {
      args: {
        username: "Tomster",
        userIsActive: true,
        userLocalTime: "4:56pm",
        // avatarTitle: "Tomster's avatar",
        // avatarInitial: "T",
        isCurrentUser: false,
      },
      blocks: {
        default: fragment(
          el("p", text("Hey!")),
          el(
            "p",
            "I love the ideas! I'm really excited about where this year's EmberConf is ",
            "going, I'm sure it's going to be the best one yet. Some quick notes:"
          ),
          el(
            "ul",
            el(
              "li",
              "Definitely agree that we should double the coffee budget this year (it ",
              "really is impressive how much we go through!)"
            ),
            el(
              "li",
              "A blimp would definitely make the venue very easy to find, but I think ",
              "it might be a bit out of our budget. Maybe we could rent some spotlights ",
              "instead?"
            ),
            el(
              "li",
              "We absolutely will need more hamster wheels, last year's line was ",
              el("em", "way"),
              " too long. Will get on that now before rental season hits ",
              "its peak."
            )
          )
        ),
      },
    })

  // fragment(
  //   SentMessageAvatar(owner)(),
  //   el(
  //     "section",
  //     SentMessageUsername(owner)(),
  //     el("p", text("Hey!")),
  //     el(
  //       "p",
  //       text(
  //         "I love the ideas! I'm really excited about where this year's EmberConf is "
  //       ),
  //       text(
  //         "going, I'm sure it's going to be the best one yet. Some quick notes:"
  //       )
  //     ),
  //     el(
  //       "ul",
  //       el(
  //         "li",
  //         text(
  //           "Definitely agree that we should double the coffee budget this year (it "
  //         ),
  //         text("really is impressive how much we go through!)")
  //       ),
  //       el(
  //         "li",
  //         text(
  //           "A blimp would definitely make the venue very easy to find, but I think "
  //         ),
  //         text(
  //           "it might be a bit out of our budget. Maybe we could rent some spotlights "
  //         ),
  //         text("instead?")
  //       ),
  //       el(
  //         "li",
  //         text(
  //           "We absolutely will need more hamster wheels, last year's line was "
  //         ),
  //         el("em", text("way")),
  //         text(" too long. Will get on that now before rental season hits "),
  //         text("its peak.")
  //       )
  //     )
  //   )
  // )
);
