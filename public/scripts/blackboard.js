const socket = io();
const canvas = document.getElementsByClassName('blackboard')[0];
const ctx = canvas.getContext('2d');
const canvasBuffer = document.createElement('canvas');
const ctxBuffer = canvasBuffer.getContext('2d');
const colors = document.getElementsByClassName('color');

let clientData = {
  totalOnline: 0,
  selectedColor: 'white',
  currentPos: {}
 };

window.addEventListener('resize', onResize);
onResize();

function refreshCurrentColorRect() {
  ctx.fillStyle = clientData.selectedColor;
  ctx.fillRect(20, 20, 40, 40);
}
function refreshTotalOnlineComponent() {
  ctx.fillStyle = 'white';
  ctx.font = '18px sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  if (clientData.totalOnline && clientData.totalOnline > 1) {
    ctx.fillText(`${clientData.totalOnline} online`, canvas.width - 20, 20);
  }
}
function setCurrentColorByElement(el) {
  let color = el.className.split(' ')[1];
  clientData.selectedColor = color;
  refreshCurrentColorRect();
}
let totalOnline;
function onLogin(data) {
  clientData.totalOnline = data.totalOnline;
  refreshComponents();
}
function onLogout(data) {
  clientData.totalOnline = data.totalOnline;
  refreshComponents();
}
function refreshComponents() {
  clearAndRedrawLines();
  refreshCurrentColorRect();
  refreshTotalOnlineComponent();
}

let drawing = false;

canvas.addEventListener('mousedown', onMouseDown);
canvas.addEventListener('mouseup', onMouseUp);
canvas.addEventListener('mouseout', onMouseUp);
canvas.addEventListener('mousemove', throttle(onMouseMove, 10));

for (let i = 0; i < colors.length; i++){
  colors[i].addEventListener('click', onColorUpdate);
}

socket.on('login', onLogin);
socket.on('logout', onLogout);
socket.on('drawing', onDrawingEvent);


function drawLineInCtx(ctx, x0, y0, x1, y1, color) {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.closePath();
}
function drawLine(x0, y0, x1, y1, color, emit = false) {
  drawLineInCtx(ctx, x0, y0, x1, y1, color);
  drawLineInCtx(ctxBuffer, x0, y0, x1, y1, color);

  if (emit) {
    let w = canvas.offsetWidth;
    let h = canvas.offsetHeight;

    socket.emit('drawing', {
      x0: x0 / w,
      y0: y0 / h,
      x1: x1 / w,
      y1: y1 / h,
      color: color
    });
  }
}

function onMouseDown(e) {
  // deselect any text etc
  window.getSelection().removeAllRanges();
  drawing = true;
  clientData.currentPos.x = e.clientX;
  clientData.currentPos.y = e.clientY;
}

function onMouseUp(e) {
  if (drawing) {
    drawing = false;
    let canvasRect = canvas.getBoundingClientRect();
    drawLine(clientData.currentPos.x - canvasRect.left, clientData.currentPos.y - canvasRect.top,
       e.clientX - canvasRect.left, e.clientY - canvasRect.top, clientData.selectedColor, true);
  }
}

function debug(msg) {
  document.getElementById("jm-console-instructions").textContent = msg;
}
function onMouseMove(e) {
  if (drawing) {
    let canvasRect = canvas.getBoundingClientRect();
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
  let w = canvas.offsetWidth;
  let h = canvas.offsetHeight;
  drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color);
}

function clearAndRedrawLines() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(canvasBuffer, 0, 0);
}

function onResize() {
  // I want to keep the state. By default it clears the canvas on resize!
  const newWidth = window.innerWidth * .75;
  const newHeight = newWidth / 2;
  canvas.width = newWidth;
  canvas.height = newHeight;
  // taking away the width/height stops it from scaling but looks more normal lol
  ctx.drawImage(canvasBuffer, 0, 0, newWidth, newHeight);
  canvasBuffer.width = newWidth;
  canvasBuffer.height = newHeight;
  ctxBuffer.drawImage(canvas, 0, 0);
  refreshComponents();
}
