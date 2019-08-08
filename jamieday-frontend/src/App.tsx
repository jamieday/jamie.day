import React from "react";
import logo from "./cone-icon.png";
import "./App.css";

const App: React.FunctionComponent = () => {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p style={{ fontSize: 28, marginTop: 0 }}>
          Recently decided to redo this site from scratch.
        </p>
        <p style={{ fontSize: 20, marginTop: 5 }}>
          Won't take me too long to get something up and running.
        </p>
        <p style={{ fontSize: 16, marginTop: 8 }}>
          In the meantime, check out my{" "}
          <a className="App-link" href="https://www.linkedin.com/in/dayjamie/">
            LinkedIn
          </a>{" "}
          and{" "}
          <a className="App-link" href="https://github.com/jamieday">
            GitHub
          </a>
          .
        </p>
      </header>
    </div>
  );
};

export default App;
