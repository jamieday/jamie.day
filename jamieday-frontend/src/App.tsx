import React from 'react';
import './App.css';

type InputProps = { placeholder: string };
const Input: React.FunctionComponent<InputProps> = ({
  placeholder
}) => (
  <input
    style={{
      backgroundColor: '#ddd',
      border: '1px solid gray',
      color: 'gray',
      margin: 15,
      padding: 15,
      borderRadius: 5
    }}
    type="text"
    placeholder={placeholder}
  />
);

const App: React.FunctionComponent = () => {
  return (
    <div className="App">
      <div>
        <header className="App-header">
          <div className="Title">
            <span>log</span>
            <span style={{ textDecoration: 'underline' }}>in</span>
            <span
              style={{
                color: '#0d0'
              }}
            >
              secure
            </span>
          </div>

          <Input placeholder="Enter your email..." />
          <Input placeholder="Enter your password..." />
          <input
            style={{ padding: '5px 15px', backgroundColor: '#ddd' }}
            type="submit"
            value="Sign in"
          />
        </header>
      </div>
      <p style={{ fontSize: 16, marginTop: 8 }}>
        This is a side-project I'm working on called LoginSecure.
        <br />
        <br /> Check out my{' '}
        <a
          className="App-link"
          href="https://www.linkedin.com/in/dayjamie/"
        >
          LinkedIn
        </a>{' '}
        and{' '}
        <a className="App-link" href="https://github.com/jamieday">
          GitHub
        </a>{' '}
        for more.
      </p>
    </div>
  );
};

export default App;
