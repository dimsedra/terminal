declare module "ascii-magic-art/runtime/player.js" {
  export function frameHTML(
    frame: string | { text: string; color: string },
    palette?: Record<string, string>,
    ink?: string
  ): string;
  export function frameText(frame: string | { text: string; color: string }): string;
  export function play(
    pre: HTMLPreElement,
    mod: any,
    opts?: {
      speed?: number;
      still?: boolean;
      look?: Record<string, any>;
      dom?: boolean;
      onFrame?: (frame: any, t: number) => void;
    }
  ): () => void;
}

declare module "ascii-magic-art/lib/kit.js" {
  export class Grid {
    cols: number;
    rows: number;
    constructor(cols: number, rows: number);
    clear(ch?: string, co?: string): this;
    inside(x: number, y: number): boolean;
    set(x: number, y: number, ch: string, co?: string): void;
    setZ(x: number, y: number, z: number, ch: string, co?: string): void;
    get(x: number, y: number): string;
    frame(): string | { text: string; color: string };
  }
  export function palette(hexes: string[]): Record<string, string>;
  export function gradient(stops: string[], n?: number): string[];
  export function rotX(p: [number, number, number], a: number): [number, number, number];
  export function rotY(p: [number, number, number], a: number): [number, number, number];
  export function rotZ(p: [number, number, number], a: number): [number, number, number];
}

declare module "ascii-magic-art/pieces/*.js" {
  const mod: any;
  export default mod;
}
