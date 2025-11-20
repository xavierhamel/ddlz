type EventHandler<K, T = any> = K extends '*' ? () => void : (data: T) => void;

export class EventEmitter<Events extends Record<string, any>> {
  private listeners: {
    [K in keyof Events | '*']?: EventHandler<K, Events[K]>[]
  } = {};

  on<K extends keyof Events | '*'>(event: K, handler: EventHandler<K, Events[K]>) {
    (this.listeners[event] ||= []).push(handler);
    return () => this.off(event, handler)
  }

  off<K extends keyof Events | '*'>(event: K, handler: EventHandler<K, Events[K]>) {
    this.listeners[event] = this.listeners[event]?.filter(h => h !== handler);
  }

  emit<K extends keyof Events | '*'>(event: K, data: Events[K]) {
    this.listeners[event]?.forEach(handler => handler(data));
    if (this.listeners['*']) {
      this.listeners['*']?.forEach(handler => handler());
    }
  }
}
