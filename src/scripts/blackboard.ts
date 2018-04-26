import { WebSocketInfo } from './main.js';
import { SocketEvent, Drawing } from './shared/socket-payloads.js';

const supportedColors = [
  "#E0E0E0", "#f44336", "#4CAF50", "#2196F3", "#FFEB3B  ", "#E91E63"
];

export default class Blackboard {
  ws: WebSocketInfo;

  canvas: HTMLCanvasElement;
  canvasBuffer: HTMLCanvasElement;

  ctx: CanvasRenderingContext2D;
  ctxBuffer: CanvasRenderingContext2D;

  trashImage: HTMLImageElement;

  colors: HTMLElement;

  constructor(ws: WebSocketInfo) {
    this.ws = ws;

    this.canvas = document.createElement("canvas");
    this.canvas.className = "blackboard";
    this.canvas.width = Math.floor(window.innerWidth)
    this.canvas.height = 400;
    this.ctx = <CanvasRenderingContext2D> this.canvas.getContext('2d');
    this.trashImage = new Image();
    this.trashImage.src = "/images/trash.png";

    this.canvasBuffer = document.createElement('canvas');
    this.ctxBuffer = <CanvasRenderingContext2D> this.canvasBuffer.getContext('2d');

    this.colors = document.createElement("div");
    this.colors.className = "colors";
    // this.colors.style.width = `${this.canvas.width}px`;
    for (let supportedColor of supportedColors) {
      let color = document.createElement("div");
      color.className = "color";
      color.style.backgroundColor = supportedColor;
      this.colors.appendChild(color);
    }
    this.registerEventListeners();
  }

  attachTo(parentElement: Element) {
    parentElement.appendChild(this.canvas);
    parentElement.appendChild(this.colors);
  }

  registerEventListeners() {
    let self = this;
    let clientData = {
      selectedColor: 'white',
      currentPos: { x: 0, y: 0 }
     };

     function drawArrow(x: number, y: number) {
       self.ctx.beginPath();
       self.ctx.moveTo(x, y);
       self.ctx.lineTo(x, y+17);
       self.ctx.moveTo(x, y+17);
       self.ctx.lineTo(x - 7, y + 12);
       self.ctx.moveTo(x, y+17);
       self.ctx.lineTo(x + 7, y+12);
       self.ctx.strokeStyle = self.ctx.fillStyle;
       self.ctx.lineWidth = 2;
       self.ctx.stroke();
       self.ctx.closePath();
     }

    function redrawBlackboardTitle() {
      self.ctx.fillStyle = "white";
      self.ctx.font = "18px sans-serif";
      self.ctx.textAlign = "center";
      self.ctx.textBaseline = "top";

      let titleX = self.canvas.width / 2, titleY = 0;
      self.ctx.fillText("Interactive Online Blackboard", titleX, titleY);
    }
    function redrawTrashComponent() {
      // self.ctx.drawImage(self.trashImage, 20, 20, 40, 40);
    }
    function setCurrentColorByElement(el: HTMLElement) {
      clientData.selectedColor = el.style.backgroundColor || "white";
      // can't do for of on htmlcollection in safari :(
      for (let i=0; i<self.colors.children.length; i++) {
        (<HTMLElement> self.colors.children[i]).style.border = "4px solid grey";
      }
      el.style.border = "4px solid white";
    }
    function redrawComponents() {
      clearAndRedrawLines();
      redrawBlackboardTitle();
      redrawTrashComponent();
    }

    redrawComponents();

    let drawing = false;

    self.canvas.addEventListener('pointerdown', onPointerDown);
    self.canvas.addEventListener('pointerup', onPointerUp);
    self.canvas.addEventListener('pointerout', onPointerUp);
    self.canvas.addEventListener('pointermove', onPointerMove);

    for (let i=0; i<self.colors.children.length; i++) {
      self.colors.children[i].addEventListener('click', onColorUpdate);
    }
    setCurrentColorByElement(<HTMLElement> self.colors.children[0]);

    self.ws.socket.on(SocketEvent.Drawing, onDrawingEvent);

    function drawLineInCtx(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, color: string) {
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.closePath();
    }
    function drawLine(x0: number, y0: number, x1: number, y1: number, color: string, emit = false) {
      drawLineInCtx(self.ctx, x0, y0, x1, y1, color);
      drawLineInCtx(self.ctxBuffer, x0, y0, x1, y1, color);

      if (emit) {
        let w = self.canvas.width;
        let h = self.canvas.height;

        self.ws.socket.emit(SocketEvent.Drawing, new Drawing.Payload(x0 / w, y0 / h, x1 / w, y1 / h, color));
      }
    }

    // limit the number of events per second
    function throttler<T>(delay: number) {
      let previousCall = 0;
      return (result: () => T, orElse?: () => T) => {
        let time = new Date().getTime();

        if ((time - previousCall) >= delay) {
          previousCall = time;
          return result();
        }
        return typeof orElse === 'undefined'
          ? undefined
          : orElse();
      };
    }

    const canEmitThrottler = throttler<boolean>(10);
    const canEmitDrawingEvent = () => true;//() => <boolean> canEmitThrottler(() => true, () => false);

    function onPointerDown(e: PointerEvent) {
      // deselect any text etc
      window.getSelection().removeAllRanges();

      drawing = true;
      clientData.currentPos.x = e.clientX;
      clientData.currentPos.y = e.clientY;
      let canvasRect = self.canvas.getBoundingClientRect();
      drawLine(e.clientX - canvasRect.left, e.clientY - canvasRect.top,
        e.clientX - canvasRect.left, e.clientY - canvasRect.top - 1, clientData.selectedColor, canEmitDrawingEvent());
    }

    function onPointerUp(e: PointerEvent) {
      if (drawing) {
        drawing = false;
        const canvasRect = self.canvas.getBoundingClientRect();
        drawLine(clientData.currentPos.x - canvasRect.left, clientData.currentPos.y - canvasRect.top,
           e.clientX - canvasRect.left, e.clientY - canvasRect.top, clientData.selectedColor, canEmitDrawingEvent());
      }
    }

    function onPointerMove(e: PointerEvent) {
      if (drawing) {
        const canvasRect = self.canvas.getBoundingClientRect();
        drawLine(clientData.currentPos.x - canvasRect.left, clientData.currentPos.y - canvasRect.top,
           e.clientX - canvasRect.left, e.clientY - canvasRect.top, clientData.selectedColor, canEmitDrawingEvent());
        clientData.currentPos.x = e.clientX;
        clientData.currentPos.y = e.clientY;
      }
    }

    function onColorUpdate(e: Event) {
      setCurrentColorByElement(<HTMLElement> e.target);
    }

    function onDrawingEvent(data: Drawing.Payload) {
      let w = self.canvas.width;
      let h = self.canvas.height;
      drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color);
    }

    function clearAndRedrawLines() {
      self.ctx.fillStyle = "#242424";
      self.colors.style.backgroundColor = self.ctx.fillStyle;
      self.ctx.fillRect(0, 0, self.canvas.width, self.canvas.height);
      self.ctx.drawImage(self.canvasBuffer, 0, 0);
    }
  }
}
