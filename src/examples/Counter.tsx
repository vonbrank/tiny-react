import typescriptLogo from "@/typescript.svg";
import viteLogo from "/vite.svg";
import TinyReact from "@/tiny-react/tiny-react";

const Counter = () => {
  const [counter, setCounter] = TinyReact.useState(0);

  const handleClickButton = () => {
    setCounter((current) => current + 1);
  };

  return (
    <div>
      <a href="https://vitejs.dev" target="_blank">
        <img src={viteLogo} className="logo" alt="Vite logo" />
      </a>
      <a href="https://www.typescriptlang.org/" target="_blank">
        <img
          src={typescriptLogo}
          className="logo vanilla"
          alt="TypeScript logo"
        />
      </a>
      <h1>Vite + TypeScript</h1>
      <div className="card">
        <button type="button" onClick={handleClickButton}>
          count is {counter}
        </button>
      </div>
      <p className="read-the-docs">
        Click on the Vite and TypeScript logos to learn more
      </p>
    </div>
  );
};

export default Counter;
