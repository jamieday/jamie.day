export enum SocketEvent {
  Login = 'login',
  Logout = 'logout',
  Drawing = 'drawing',
  CommandEntered = 'command-entered',
  FloatingMsg = 'floating-msg'
}

export namespace Login {
  export class Payload {
    constructor(public totalOnline: number) {}
  }
}

export namespace Drawing {
  export class Payload {
    constructor(public x0: number, public y0: number, public x1: number, public y1: number, public color: string) {}

    static isWithinBounds(payload: Payload) { return true; }
  }
}

// todo move to util
function randomBetween(min: number, max: number) {
  return min + Math.random() * (max-min);
}

export namespace CommandEntered {
  export class Payload {
    constructor(public command: string) {}
  }
}

export namespace FloatingMsg {
  export interface Position {
    top: string | null,
    left: string | null,
    right: string | null
  }

  export class Payload {
    static readonly maxMessageLength: number = 17;
    static readonly minFontSize: number = 8;
    static readonly maxFontSize: number = 24;

    private constructor(public message: string, public fontSizePx: number, public position: Position) {
      this.message = this.sanitizeMessage(message);
      this.fontSizePx = fontSizePx;
      this.position = position;
    }

    sanitizeMessage(message: string) {
      return message.length > 14
        ? message.substring(0, 14) + '...'
        : message;
    }

    static Generate(message: string) {
      const position: Position = <Position> {
        top: `${Math.random()*80}%`
      };
  
      if (Math.random() > 0.5) 
        position.left = `${Math.random()*20}%`;
      else 
        position.right = `${Math.random()*20}%`;
  
      return new Payload(message, randomBetween(Payload.minFontSize, Payload.maxFontSize), position);
    }
  }
}