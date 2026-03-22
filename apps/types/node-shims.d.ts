declare module 'node:assert/strict' {
  const assert: any;
  export = assert;
}

declare module 'node:test' {
  const test: any;
  export default test;
}

declare module 'node:fs/promises' {
  export const mkdir: any;
  export const writeFile: any;
  export const mkdtemp: any;
  export const readdir: any;
  export const readFile: any;
}

declare module 'node:path' {
  export const join: (...parts: string[]) => string;
}

declare module 'node:os' {
  export const tmpdir: () => string;
}
