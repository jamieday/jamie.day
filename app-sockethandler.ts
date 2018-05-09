import { SocketEvent, Drawing, FloatingMsg, Login, CommandEntered, Connect, Disconnect, Logout, Init } from './src/scripts/shared/socket-payloads';

class User {
  constructor(public id: string, public username: string) {}
}

export default class SocketHandler {
  io: SocketIO.Server;

  loggedInUsers: { [index: string] : User | undefined } = {};

  private getUserById(socketId: string) {
    return this.loggedInUsers[socketId];
  }

  constructor(io: SocketIO.Server) {
    this.io = io;
  }
  get totalOnline() {
    return Object.keys(this.loggedInUsers).length;
  }
  registerListeners() {
    this.io.sockets.on(SocketEvent.Connection, this.onConnection.bind(this));
  }
  registerListenersForUser(socket: SocketIO.Socket) {
    socket.on(SocketEvent.Disconnect, this.onDisconnect(socket).bind(this));
    socket.on(SocketEvent.Login, this.onLogin(socket).bind(this));
    socket.on(SocketEvent.Logout, this.onLogout(socket).bind(this));
    socket.on(SocketEvent.Drawing, this.onDraw(socket));
    socket.on(SocketEvent.CommandEntered, this.onCommandEntered(socket));
  }
  onConnection(socket: SocketIO.Socket) {
    this.registerListenersForUser(socket);
    console.log(`A user has connected: ${socket.id}`);

    socket.emit(SocketEvent.Init, new Init.Payload(this.totalOnline));
    socket.broadcast.emit(SocketEvent.Connection, new Connect.Payload());
  }
  onDisconnect(socket: SocketIO.Socket) {
    return () => {
      const user = this.getUserById(socket.id);
      if (user) {
        this.onLogout(socket)();
      }
      console.log(`A user has disconnected: ${socket.id}${user ? ` (${user.username})` : ''}`);
      
      this.io.sockets.emit(SocketEvent.Disconnect, new Disconnect.Payload());
    }
  }
  onLogin(socket: SocketIO.Socket) {
    return (data: Login.EmitPayload) => {
      const newUser = new User(socket.id, data.username);
      this.loggedInUsers[newUser.id] = newUser;
      console.log(`A user has logged in: ${newUser.id} (${newUser.username})`);
      
      this.io.sockets.emit(SocketEvent.Login, new Login.EventPayload(newUser.username, this.totalOnline));
    }
  }
  onLogout(socket: SocketIO.Socket) {
    return () => {
      const user = this.getUserById(socket.id);
      if (typeof user === 'undefined') {
        return;
      }
      delete this.loggedInUsers[user.id];
      console.log(`A user has logged out: ${socket.id} (${user.username})`);
      
      this.io.sockets.emit(SocketEvent.Logout, new Logout.EventPayload(user.username, this.totalOnline));
    }
  }
  onDraw(socket: SocketIO.Socket) {
    return (data: Drawing.Payload) => {
      if (Drawing.Payload.isWithinBounds(data)) {
        socket.broadcast.emit(SocketEvent.Drawing, data);
      }
    }
  }
  onCommandEntered(socket: SocketIO.Socket) {
    return (data: CommandEntered.Payload) => {
      if (data.command.trim().length > 0) {
        this.io.sockets.emit(SocketEvent.FloatingMsg, FloatingMsg.Payload.Generate(data.command));
        socket.broadcast.emit(SocketEvent.CommandEntered, data);
      }
    }
  }
}