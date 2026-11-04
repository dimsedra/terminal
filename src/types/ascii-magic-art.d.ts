declare module "ascii-magic-art/runtime/player.js" {
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

declare module "ascii-magic-art/pieces/*.js" {
  const mod: any;
  export default mod;
}
