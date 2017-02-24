var Page = React.createClass({
  getInitialState: function() {
    return { state: null };
  },
  render: function() {
    return (
      <div ref={(content) => { this.content = content; }} style={this.state.style}>
      </div>
      );
  },
  componentDidMount: function() {
    // this system is built such that even if some animations don't fire correctly everything still goes as planned
    this.msTillCurrentTask = 0
    this.debugMode = true;
    this.debugScheduler = false;
    this.atBreakPoint = false; // for debug

    // begin page actions
    this.beginPageLogic();
  },
  beginPageLogic: function() {
    // Basically the following is the entire page data
    this.setState({ style: {textAlign: "center", position: "absolute", top: "40%", width: "100%"} });
    let welcomeText = document.createElement("h3");
    welcomeText.innerHTML = "Welcome.";
    welcomeText.style.visibility = "hidden";
    welcomeText.style.opacity = 0;
    this.content.appendChild(welcomeText);

    this.scheduleTask((duration) => {this.fadeIn(welcomeText, duration)}, 2000);
    this.scheduleWait(1000); // wait one second, then fade out
    this.scheduleTask((duration) => {this.fadeOut(welcomeText, duration)}, 2000);
    this.scheduleTask(() => {this.content.removeChild(welcomeText)});
  },
  getMsTillCurrentTask: function() {
    if (this.debugScheduler && !this.atBreakPoint) return 0;
    return this.msTillCurrentTask;
  },
  scheduleTask: function(action, actionDurationMs) { // generally used if the action takes time (like animations)
    if (this.debugMode) {
      let iot2 = action.toString().substring(action.toString().indexOf("_this2")+7);
      let funcName = iot2.substring(0, iot2.indexOf("(")) + "()";
      console.log('Scheduling ' + funcName + ' at ' + this.getMsTillCurrentTask() + 'ms');
    }
    if (this.getMsTillCurrentTask() == 0)
      action(actionDurationMs);
    else
      setTimeout(function(){action(actionDurationMs)}, this.getMsTillCurrentTask());

    // schedule a wait to delay future tasks
    if (actionDurationMs)
      this.scheduleWait(actionDurationMs);
  },
  scheduleWait: function(ms) {
    this.msTillCurrentTask += ms;
  },
  debugHere: function() {
    if (!this.debugScheduler) return;
    this.atBreakPoint = true;
    this.msTillCurrentTask = 0;
  },
  fadeIn: function(element, ms) {
    window.requestAnimationFrame(function() {
      element.style.visibility = "visible";
      element.style.transition = "opacity "+ms+"ms ease-in-out";
      element.style.opacity = 1;
    });
  },
  fadeOut: function(element, ms) {
    window.requestAnimationFrame(function() {
      element.style.transition = "opacity "+ms+"ms ease-out";
      element.style.opacity = 0;
    });
  }
});

ReactDOM.render(
  <Page />,
  document.getElementById('content')
);
