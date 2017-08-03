function onDraw(data) {
  socket.broadcast.emit('drawing', data);
}
module.exports = {
  onConnection: (socket) => {
    socket.on('drawing', onDraw);
  }
};
