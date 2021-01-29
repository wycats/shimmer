import { Doc, Services } from "@shimmer/core";
import { EventService, SimplestDocument } from "@shimmer/dom";
import { TestEventHooks } from "./integration/utils";

export function TestServices(doc: SimplestDocument): Services {
  return {
    router: null as any,
    doc: new Doc(doc),
    events: EventService.of(TestEventHooks),
  };
}
