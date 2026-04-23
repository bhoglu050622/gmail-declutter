import { EventEmitter } from "events";

const globalForEmitter = globalThis as unknown as {
  scanEmitter: EventEmitter | undefined;
};

export const scanEmitter =
  globalForEmitter.scanEmitter ?? new EventEmitter().setMaxListeners(100);

if (process.env.NODE_ENV !== "production") {
  globalForEmitter.scanEmitter = scanEmitter;
}
