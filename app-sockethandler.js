class SocketHandler {
  constructor(io) {
    this.io = io;
  }
  async getTotalOnline() {
    return new Promise((resolve, reject) => {
      this.io.clients((error, clients) => {
        if (error) reject(error);
        resolve(clients.length);
      });
    });
  }
  registerListeners() {
    this.io.sockets.on('connection', this.onConnection.bind(this));
  }
  onDraw(socket) {
    return data => {
      socket.broadcast.emit('drawing', data);
    }
  }
  onFloatingMsg(socket) {
    return data => {
      socket.broadcast.emit('floating-msg', data);
    }
  }
  async onConnection(socket) {
    console.log(`User connected: ${socket.id}`);
    this.io.sockets.emit('login', {totalOnline: await this.getTotalOnline()});
    socket.on('disconnect', this.onDisconnect(socket).bind(this));
    socket.on('drawing', this.onDraw(socket));
    socket.on('floating-msg', this.onFloatingMsg(socket));
  }
  onDisconnect(socket) {
    return async () => {
      console.log(`User disconnected: ${socket.id}`);
      socket.broadcast.emit('logout', {totalOnline: await this.getTotalOnline()});
    }
  }
}
module.exports = {
  createHandler(io) {
    return new SocketHandler(io);
  }
};
