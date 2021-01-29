import type { SimplestElement } from "./simplest";

export class On<EventType> {
  #off: () => void;
  #fire: (event: EventType) => Dispositions;
  #unregister: () => void;

  constructor(
    off: () => void,
    fire: (event: EventType) => Dispositions,
    unregister: () => void
  ) {
    this.#off = off;
    this.#fire = fire;
    this.#unregister = unregister;
  }

  fire(event: EventType): Dispositions {
    return this.#fire(event);
  }

  off(): void {
    this.#off();
    this.#unregister();
  }
}

type Disposition =
  | {
      type: "stopPropagation";
    }
  | {
      type: "stopImmediatePropagation";
    }
  | {
      type: "preventDefault";
    };

type Dispositions = readonly Disposition[];

export interface EventHooksDefinition<Hooks extends EventHooks> {
  create(map: EventHandlerMap<Hooks>): Hooks;
}

export interface EventHooks<
  El extends SimplestElement = SimplestElement,
  EventType = object
> {
  ELEMENT_TYPE: El;
  EVENT_TYPE: EventType;

  addEventListener(options: {
    element: El;
    event: string;
    callback: (event: EventType) => Dispositions;
  }): () => void;

  fire(options: {
    element: El;
    event: string;
    callback: On<EventHooks["EVENT_TYPE"]>;
    data: EventHooks["EVENT_TYPE"];
  }): void;
}

export class EventHandlerMap<Hooks extends EventHooks> {
  #events = new WeakMap<
    Hooks["ELEMENT_TYPE"],
    Record<string, Set<On<Hooks["EVENT_TYPE"]>>>
  >();

  set(
    element: Hooks["ELEMENT_TYPE"],
    eventName: string,
    value: On<Hooks["EVENT_TYPE"]>
  ): void {
    let allHandlers = this.#events.get(element);

    if (!allHandlers) {
      allHandlers = {} as Record<string, Set<On<Hooks["EVENT_TYPE"]>>>;
      this.#events.set(element, allHandlers);
    }

    let eventHandlers = allHandlers[eventName];

    if (!eventHandlers) {
      eventHandlers = new Set();
      allHandlers[eventName] = eventHandlers;
    }

    eventHandlers.add(value);
  }

  get(
    element: Hooks["ELEMENT_TYPE"],
    eventName: string
  ): Set<On<Hooks["EVENT_TYPE"]>> | null {
    let allHandlers = this.#events.get(element);

    if (!allHandlers) {
      return null;
    }

    let eventHandlers = allHandlers[eventName];

    if (!eventHandlers) {
      return null;
    }

    return eventHandlers;
  }

  delete(
    element: Hooks["ELEMENT_TYPE"],
    eventName: string,
    value: On<Hooks["EVENT_TYPE"]>
  ): void {
    let allHandlers = this.#events.get(element);

    if (!allHandlers) {
      return;
    }

    let eventHandlers = allHandlers[eventName];

    if (!eventHandlers) {
      return;
    }

    eventHandlers.delete(value);
  }
}

export class EventService<Hooks extends EventHooks = EventHooks> {
  static of<Hooks extends EventHooks>(
    definition: EventHooksDefinition<Hooks>
  ): EventService<Hooks> {
    let map = new EventHandlerMap<Hooks>();
    let hooks = definition.create(map);
    return new EventService(map, hooks);
  }

  #events: EventHandlerMap<Hooks>;
  #hooks: EventHooks<Hooks["ELEMENT_TYPE"], Hooks["EVENT_TYPE"]>;

  constructor(events: EventHandlerMap<Hooks>, hooks: Hooks) {
    this.#hooks = hooks;
    this.#events = events;
  }

  fire(
    element: Hooks["ELEMENT_TYPE"],
    eventName: string,
    data: Hooks["EVENT_TYPE"]
  ): void {
    let events = this.#events.get(element, eventName);

    if (events) {
      for (let event of events) {
        this.#hooks.fire({ element, event: eventName, callback: event, data });
      }
    }
  }

  on(
    element: Hooks["ELEMENT_TYPE"],
    eventName: string,
    callback: (event: Hooks["EVENT_TYPE"]) => Dispositions
  ): On<Hooks["EVENT_TYPE"]> {
    let off = this.#hooks.addEventListener({
      element,
      event: eventName,
      callback,
    });

    let on: On<Hooks["EVENT_TYPE"]> = new On(off, callback, () =>
      this.#events.delete(element, eventName, on)
    );
    this.#events.set(element, eventName, on);

    return on;
  }
}
