import * as React from 'react';
import ReactDOM from 'react-dom';

export const HelloWorld: React.FunctionComponent = () => (
  <h1>Hello, World!</h1>
);

ReactDOM.render(<HelloWorld />, document.getElementById('root'));
alert('something happened at least');
