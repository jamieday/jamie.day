export enum SocketEvent {
  Login = 'login',
  Logout = 'logout',
  Drawing = 'drawing',
  FloatingMsg = 'floating-msg'
}

export class LoginPayload {
  totalOnline: number;

  constructor(totalOnline: number) {
    this.totalOnline = totalOnline;
  }
}

export class DrawingPayload {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  color: string;

  constructor(x0: number, y0: number, x1: number, y1: number, color: string) {
    this.x0 = x0;
    this.y0 = y0;
    this.x1 = x1;
    this.y1 = y1;
    this.color = color;
  }
}

export namespace FloatingMsg {
  export interface Position {
    top: string | null,
    left: string | null,
    right: string | null
  }

  export class Position {
    static Random() {
      const position: Position = <Position> {
        top: `${Math.random()*100}%`
      };
  
      if (Math.random() > 0.5) 
        position.left = `${Math.random()*70}px`;
      else 
        position.right = `${Math.random()*70}px`;
  
      return position;
    }
  }

  export class Payload {
    message: string;
    position: Position;
  
    constructor(message: string, position: Position) {
      this.message = message;
      this.position = position;
    }
  }
}