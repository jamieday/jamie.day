var JumboInput = React.createClass({
  getInitialState: function() {
    return {value: ""}
  },
  handleValueChange: function(e) {
    this.setState({value: e.target.value});
  },
  handleKeyPress: function(e) {
    if (e.keyCode == 13) {
      this.props.onSubmit(this.state.value);
      this.state.value = "";
    }
  },
  render: function() {
    var className = "main_input";
    if (this.state.value.toLowerCase().indexOf("j") > -1) {
      className = "main_input green";
    }
    return (
      <div className="main_input_container">
        <input 
          className={className}
          type={this.props.input.type} 
          placeholder={this.props.input.placeholder}
          value={this.state.value}
          onChange={this.handleValueChange}
          onKeyDown={this.handleKeyPress} 
          autoFocus />
      </div>
    );
  }
});



var usernameInput = {
  "type": "text",
  "placeholder": "Enter your username."
};
var passwordInput = {
  "type": "password",
  "placeholder": "Enter your password."
};

var SecurityPage = React.createClass({
  getInitialState: function() {
    return {username: null, password: null, input: usernameInput };
  },
  handleInputSubmit: function(value) {
    if (this.state.input == usernameInput) {
      this.setState({username: value, input: passwordInput});
    } else {
      this.props.next({username: this.state.username, password: value});
    }
  },
  render: function() {
    return <JumboInput input={this.state.input} onSubmit={this.handleInputSubmit}/>;
  }
});

var HomePage = React.createClass({
  render: function() {
    return  <div>
             <h1>Welcome to the site, {this.props.username}!</h1>
             <p>This site is full of fun things! For example, this is your password: <u>undefined</u>!!!</p>
             <p>Just kidding, we wouldn't store your password (<b>{this.props.password}</b>) in plain text - haha.</p>
             <span style={{fontSize: "small"}}>Built with <a href="https://facebook.github.io/react/index.html">ReactJS</a> (javascript framework created by Jamie Day)</span>
            </div>;
  }
});

var PageHandler = React.createClass({
  getInitialState: function() {
    return {page: <SecurityPage next={this.nextPage} />};
  },
  nextPage: function(data) {
    this.setState({page: <HomePage username={data.username} password={data.password} />});
  },
  render: function() {
      return this.state.page;
  }
});

ReactDOM.render(
  <PageHandler />,
  document.getElementById('content')
);