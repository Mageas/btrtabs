// Console logger with a [btrtabs] prefix.
// `log` is wired to console.log in dev and stripped to a no-op in production
// builds (Vite replaces `import.meta.env.DEV` with `false`, then Rollup tree-
// shakes the dev arrow function).
// `warn` is always on — it reports unexpected runtime errors.

const PREFIX = '[btrtabs]';

export const log: (...args: unknown[]) => void = import.meta.env.DEV
  ? (...args) => console.log(PREFIX, ...args)
  : () => undefined;

export function warn(...args: unknown[]): void {
  console.warn(PREFIX, ...args);
}
