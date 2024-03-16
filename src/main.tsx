import HelloWorld from "./examples/HelloWorld";
import TinyReact from "./tiny-react/tiny-react";

const element = (
  <div id="app">
    <h1>Tiny React Example</h1>
    <HelloWorld />
  </div>
);

console.log(element);

const container = document.getElementById("root");

TinyReact.render(element, container);
