declare module 'path' {
  export function join(...paths: string[]): string;
  export function dirname(path: string): string;
  export function basename(path: string): string;
  export function extname(path: string): string;
  export function resolve(...paths: string[]): string;
  export const sep: string;
}

declare module 'fs' {
  export function readFileSync(path: string): Buffer;
  export function readFileSync(path: string, encoding: string): string;
  export function writeFileSync(path: string, data: string | Buffer): void;
  export function existsSync(path: string): boolean;
  export function mkdirSync(path: string, options?: any): void;
  export function readdirSync(path: string): string[];
  export function statSync(path: string): any;
}

declare const process: {
  env: { [key: string]: string | undefined };
  exit(code?: number): never;
  cwd(): string;
  platform: string;
  arch: string;
};

declare const __dirname: string;
declare const __filename: string;
interface Buffer {
  length: number;
  toString(encoding?: string): string;
}

declare const Buffer: {
  new (str: string, encoding?: string): Buffer;
  from(data: any): Buffer;
};
declare const console: {
  log(...args: any[]): void;
  error(...args: any[]): void;
  warn(...args: any[]): void;
  info(...args: any[]): void;
};