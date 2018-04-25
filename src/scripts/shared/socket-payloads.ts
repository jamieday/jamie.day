export enum SocketEvent {
  Login = 'login',
  Logout = 'logout',
  Drawing = 'drawing',
  FloatingMsg = 'floating-msg'
}

export namespace Login {
  export class Payload {
    totalOnline: number;

    constructor(totalOnline: number) {
      this.totalOnline = totalOnline;
    }
  }
}

export namespace Drawing {
  export class Payload {
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
}

// todo move to util
function randomBetween(min: number, max: number) {
  return min + Math.random() * (max-min);
}

export namespace FloatingMsg {
  export interface Position {
    top: string | null,
    left: string | null,
    right: string | null
  }

  export class Payload {
    message: string;
    fontSize: string;
    position: Position;
  
    constructor(message: string, fontSize: string, position: Position) {
      this.message = message;
      this.fontSize = fontSize;
      this.position = position;
    }

    static Generate(message: string) {
      const position: Position = <Position> {
        top: `${Math.random()*100}%`
      };
  
      if (Math.random() > 0.5) 
        position.left = `${Math.random()*20}%`;
      else 
        position.right = `${Math.random()*20}%`;
  
      return new Payload(message, `${randomBetween(8, 24)}px`, position);
    }
  }
}