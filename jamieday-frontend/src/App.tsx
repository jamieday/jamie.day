import Autosuggest from 'react-autosuggest';
import React from 'react';
import './App.css';
import { ChangeEvent } from 'react';

const inputStyles = {
  backgroundColor: '#ddd',
  border: '1px solid gray',
  color: '#454545',
  marginBottom: 25,
  padding: 15,
  borderRadius: 5
};

const Input: React.FunctionComponent<any> = ({
  placeholder,
  ...props
}) => (
  <input
    style={inputStyles}
    type="text"
    placeholder={placeholder}
    {...props}
  />
);

type Suggestion = string;
const commonPasswords: Suggestion[] = [
  'password',
  'p4ssword',
  'ashley'
];
const renderSuggestion = (suggestion: Suggestion) => (
  <div style={{ background: 'black' }}>{suggestion}</div>
);
const PasswordAuto: React.FunctionComponent = ({}) => {
  const [password, setPassword] = React.useState('');
  const [suggestions, setSuggestions] = React.useState<
    Suggestion[]
  >([]);

  return (
    <Autosuggest
      // TODO common password list
      suggestions={suggestions}
      onSuggestionsFetchRequested={() =>
        setSuggestions(commonPasswords)
      }
      onSuggestionsClearRequested={() => setSuggestions([])}
      getSuggestionValue={x => x}
      renderSuggestion={renderSuggestion}
      inputProps={{
        type: 'password',
        placeholder: 'Enter your password...',
        value: password,
        onChange: (e, { newValue }) => setPassword(newValue)
      }}
      renderInputComponent={props => <Input {...props} />}
    ></Autosuggest>
  );
};

const LoginSecureLogo: React.FunctionComponent = () => (
  <div className="Title">
    <span>log</span>
    <span style={{ textDecoration: 'underline' }}>in</span>
    <span
      style={{
        color: '#0d0',
        marginBottom: 15
      }}
    >
      secure
    </span>
  </div>
);

const LoginSecure: React.FunctionComponent = () => {
  const [email, setEmail] = React.useState('');

  return (
    <div
      style={{
        border: '1px solid rgba(88,88,88,.66)',
        background: '#272e3a',
        borderRadius: 10,
        width: 500
      }}
    >
      <header className="App-header">
        <LoginSecureLogo />

        <Input
          placeholder="Enter your email..."
          value={email}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setEmail(e.target.value)
          }
        />
        <PasswordAuto />
        <input
          style={{ ...inputStyles, ...{ margin: '15px 0 0 0' } }}
          type="submit"
          value="Sign in"
        />
      </header>
    </div>
  );
};

const App: React.FunctionComponent = () => {
  return (
    <div className="App">
      <div style={{ margin: 15 }}>
        <LoginSecure />
      </div>
      <div style={{ color: 'white' }}>
        <p style={{ fontSize: 16, marginTop: 8 }}>
          This is a side-project I'm working on.
          <br />
          <br /> Check out my{' '}
          <a
            className="App-link"
            href="https://www.linkedin.com/in/dayjamie/"
          >
            LinkedIn
          </a>{' '}
          and{' '}
          <a
            className="App-link"
            href="https://github.com/jamieday"
          >
            GitHub
          </a>{' '}
          for more.
        </p>
      </div>
    </div>
  );
};

export default App;
