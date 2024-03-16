import TinyReact from "./tiny-react";

declare global {
  module JSX {
    interface Element extends TinyReact.JSX.Element {}
    interface IntrinsicElements extends TinyReact.JSX.IntrinsicElements {}
  }
}

export {};
