var JumboInput = React.createClass({
  getInitialState: function() {
    return {value: "", isValid: false};
  },
  handleValueChange: function(e) {
    this.setState({value: e.target.value, isValid: e.target.value});
  },
  handleKeyPress: function(e) {
    if (e.keyCode == 13) { // 13 - enter
      this.props.onSubmit(this.state.value);
	  
	  // reset
      this.state = this.getInitialState();
    }
  },
  render: function() {
    return (
      <div className="main_input_container">
        <input 
          className={"main_input" + (this.state.isValid ? " valid" : "")}
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
	  // submit username (this.state.username) & password (value)
	  window.location = '/welcome';
    }
  },
  render: function() {
    return <div>
			 <div className="signupsert-title">
		       <p>J-ME Day SIGNUPSERT&trade; Console</p>
			   <p style={{fontSize: "12px"}}>All Rights Reserved.</p>
			 </div>
		     <JumboInput input={this.state.input} onSubmit={this.handleInputSubmit}/>
		   </div>;
  }
});

ReactDOM.render(
  <SecurityPage />,
  document.getElementById('content')
);
