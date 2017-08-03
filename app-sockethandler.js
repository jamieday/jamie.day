function onDraw(socket) {
  return data => {
    socket.broadcast.emit('drawing', data);
  }
}
module.exports = {
  onConnection: socket => {
    socket.on('drawing', onDraw(socket));
  }
};
