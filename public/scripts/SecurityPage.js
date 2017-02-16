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
    return {input: usernameInput };
  },
  handleInputSubmit: function() {
    if (this.input == usernameInput) {
      this.setState({input: passwordInput});
    } else {
      this.props.next();
    }
  },
  render: function() {
    return <JumboInput input={this.state.input} onSubmit={this.handleInputSubmit}/>;
  }
});