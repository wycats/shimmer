import { main } from "./context";
import "./suite/core";
import "./suite/element";
import "./suite/staticness";
import { DOMReporter } from "./ui";

main(DOMReporter);
