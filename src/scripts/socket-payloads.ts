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