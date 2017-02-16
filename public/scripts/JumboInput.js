var JumboInput = React.createClass({
  getInitialState: function() {
    return {value: ""}
  },
  handleValueChange: function(e) {
    this.setState({value: e.target.value})
  },
  handleKeyPress: function(e) {
    if (e.keyCode == 13) {
      this.props.onSubmit(this.state.value);
      this.state.value = "";
    }
  },
  render: function() {
    return (
      <div className="main_input_container">
        <input 
          className="main_input"
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
