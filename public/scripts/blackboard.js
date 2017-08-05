const supportedColors = [
  "#E0E0E0", "#f44336", "#4CAF50", "#2196F3", "#FFEB3B  ", "#E91E63"
];

class Blackboard {
  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.className = "blackboard";
    this.ctx = this.canvas.getContext('2d');
    this.trashImage = new Image();
    this.trashImage.src = "/images/trash.png";

    this.canvasBuffer = document.createElement('canvas');
    this.ctxBuffer = this.canvasBuffer.getContext('2d');

    this.colors = document.createElement("div");
    this.colors.className = "colors";
    for (let supportedColor of supportedColors) {
      let color = document.createElement("div");
      color.className = "color";
      color.style.backgroundColor = supportedColor;
      this.colors.appendChild(color);
    }

    this.element = document.createElement("div");
    this.element.className = "blackboard-container";
    this.element.style.display = "flex";
    this.element.style.visibility = "visible";
    this.element.appendChild(this.canvas);
    this.element.appendChild(this.colors);

    this.socket = io();
    this.registerEventListeners();
  }
  registerEventListeners() {
    let self = this;
    let clientData = {
      totalOnline: 0,
      selectedColor: 'white',
      currentPos: {}
     };

    window.addEventListener('resize', onResize);
    onResize();

    function redrawTotalOnlineComponent() {
      self.ctx.fillStyle = 'white';
      self.ctx.font = '18px sans-serif';
      self.ctx.textAlign = 'right';
      self.ctx.textBaseline = 'top';
      let msg = clientData.totalOnline == 1
        ? "no one else online :("
        : `${clientData.totalOnline} online`;
      self.ctx.fillText(msg, self.canvas.width - 20, 20);
    }
    function redrawTrashComponent() {
      // self.ctx.drawImage(self.trashImage, 20, 20, 40, 40);
    }
    function setCurrentColorByElement(el) {
      clientData.selectedColor = el.style.backgroundColor;
      for (let colorElement of self.colors.children) {
        colorElement.style.border = "4px solid grey";
      }
      el.style.border = "4px solid white";
    }
    let totalOnline;
    function onLogin(data) {
      clientData.totalOnline = data.totalOnline;
      redrawComponents();
    }
    function onLogout(data) {
      clientData.totalOnline = data.totalOnline;
      redrawComponents();
    }
    function redrawComponents() {
      clearAndRedrawLines();
      redrawTotalOnlineComponent();
      redrawTrashComponent();
    }

    let drawing = false;

    self.canvas.addEventListener('mousedown', onMouseDown);
    self.canvas.addEventListener('mouseup', onMouseUp);
    self.canvas.addEventListener('mouseout', onMouseUp);
    self.canvas.addEventListener('mousemove', throttle(onMouseMove, 10));

    for (let colorElement of self.colors.children) {
      colorElement.addEventListener('click', onColorUpdate);
    }
    setCurrentColorByElement(self.colors.children[0]);

    self.socket.on('login', onLogin);
    self.socket.on('logout', onLogout);
    self.socket.on('drawing', onDrawingEvent);


    function drawLineInCtx(ctx, x0, y0, x1, y1, color) {
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.closePath();
    }
    function drawLine(x0, y0, x1, y1, color, emit = false) {
      drawLineInCtx(self.ctx, x0, y0, x1, y1, color);
      drawLineInCtx(self.ctxBuffer, x0, y0, x1, y1, color);

      if (emit) {
        let w = self.canvas.width;
        let h = self.canvas.height;

        self.socket.emit('drawing', {
          x0: x0 / w,
          y0: y0 / h,
          x1: x1 / w,
          y1: y1 / h,
          color: color
        });
      }
    }

    function onMouseDown(e) {
      e.preventDefault();
      // deselect any text etc
      window.getSelection().removeAllRanges();
      drawing = true;
      clientData.currentPos.x = e.clientX;
      clientData.currentPos.y = e.clientY;
      let canvasRect = self.canvas.getBoundingClientRect();
      drawLine(e.clientX - canvasRect.left, e.clientY - canvasRect.top,
        e.clientX - canvasRect.left, e.clientY - canvasRect.top - 1, clientData.selectedColor, true);
    }

    function onMouseUp(e) {
      if (drawing) {
        drawing = false;
        let canvasRect = self.canvas.getBoundingClientRect();
        drawLine(clientData.currentPos.x - canvasRect.left, clientData.currentPos.y - canvasRect.top,
           e.clientX - canvasRect.left, e.clientY - canvasRect.top, clientData.selectedColor, true);
      }
    }

    function debug(msg) {
      document.getElementById("jm-console-instructions").textContent = msg;
    }
    function onMouseMove(e) {
      if (drawing) {
        let canvasRect = self.canvas.getBoundingClientRect();
        drawLine(clientData.currentPos.x - canvasRect.left, clientData.currentPos.y - canvasRect.top,
           e.clientX - canvasRect.left, e.clientY - canvasRect.top, clientData.selectedColor, true);
        clientData.currentPos.x = e.clientX;
        clientData.currentPos.y = e.clientY;
      }
    }

    function onColorUpdate(e) {
      setCurrentColorByElement(e.target);
    }

    // limit the number of events per second
    function throttle(callback, delay) {
      let previousCall = new Date().getTime();
      return (...args) => {
        let time = new Date().getTime();

        if ((time - previousCall) >= delay) {
          previousCall = time;
          callback.apply(null, args);
        }
      };
    }

    function onDrawingEvent(data) {
      let w = self.canvas.width;
      let h = self.canvas.height;
      drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color);
    }

    function clearAndRedrawLines() {
      self.ctx.fillStyle = "black";
      const grd = self.ctx.createLinearGradient(self.canvas.width / 2, 0, self.canvas.width / 2, self.canvas.height);
      grd.addColorStop(0, "#171717");
      const bottomColor = "#050505";
      grd.addColorStop(1, bottomColor);
      self.colors.style.backgroundColor = bottomColor;

      self.ctx.fillStyle = grd;
      self.ctx.fillRect(0, 0, self.canvas.width, self.canvas.height);
      self.ctx.drawImage(self.canvasBuffer, 0, 0);
    }

    function onResize() {
      // I want to keep the state. By default it clears the canvas on resize!
      const newWidth = Math.floor(window.innerWidth * .75);
      const newHeight = Math.floor(newWidth / 2);
      self.colors.style.width = `${newWidth}px`;
      self.canvas.width = newWidth;
      self.canvas.height = newHeight;
      // taking away the width/height stops it from scaling but looks more normal lol
      self.ctx.drawImage(self.canvasBuffer, 0, 0, newWidth, newHeight);
      self.canvasBuffer.width = newWidth;
      self.canvasBuffer.height = newHeight;
      self.ctxBuffer.drawImage(self.canvas, 0, 0);
      redrawComponents();
    }
  }
}
