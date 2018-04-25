import { SocketEvent, Drawing, FloatingMsg, Login, CommandEntered } from './src/scripts/shared/socket-payloads';

export default class SocketHandler {
  io: SocketIO.Server;

  constructor(io: SocketIO.Server) {
    this.io = io;
  }
  async getTotalOnline() {
    return <Promise<number>> new Promise((resolve, reject) => {
      this.io.clients((error: any, clients: SocketIO.Client[]) => {
        if (error) reject(error);
        resolve(clients.length);
      });
    });
  }
  registerListeners() {
    this.io.sockets.on('connection', this.onConnection.bind(this));
  }
  onDraw(socket: SocketIO.Socket) {
    return (data: Drawing.Payload) => {
      if (data.isWithinBounds()) {
        socket.broadcast.emit(SocketEvent.Drawing, data);
      }
    }
  }
  onCommandEntered(socket: SocketIO.Socket) {
    return (data: CommandEntered.Payload) => {
      if (data.command.trim().length > 0) {
        this.io.sockets.emit(SocketEvent.FloatingMsg, FloatingMsg.Payload.Generate(data.command));
      }
    }
  }
  async onConnection(socket: SocketIO.Socket) {
    console.log(`User connected: ${socket.id}`);
    this.io.sockets.emit(SocketEvent.Login, new Login.Payload(await this.getTotalOnline()));
    socket.on('disconnect', this.onDisconnect(socket).bind(this));
    socket.on(SocketEvent.Drawing, this.onDraw(socket));
    socket.on(SocketEvent.CommandEntered, this.onCommandEntered(socket));
  }
  onDisconnect(socket: SocketIO.Socket) {
    return async () => {
      console.log(`User disconnected: ${socket.id}`);
      socket.broadcast.emit(SocketEvent.Logout, new Login.Payload(await this.getTotalOnline()));
    }
  }
}