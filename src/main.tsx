import Counter from "./examples/Counter";
import HelloWorld from "./examples/HelloWorld";
import TinyReact from "./tiny-react/tiny-react";
import "./style.scss";

const element = (
  <div id="app">
    <h1>Tiny React Example</h1>
    <HelloWorld />
    <Counter />
  </div>
);

console.log("element = ", element);

const container = document.getElementById("root");

TinyReact.render(element, container);
