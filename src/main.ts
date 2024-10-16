import "./style.css";

const APP_NAME = "Draw";
const app = document.querySelector<HTMLDivElement>("#app")!;

// Set the document's title
document.title = APP_NAME;

// Create the h1 element for the app title
const titleElement = document.createElement("h1");
titleElement.textContent = APP_NAME;

// Create the canvas element
const canvasElement = document.createElement("canvas");
canvasElement.id = "gameCanvas";
canvasElement.width = 256;
canvasElement.height = 256;

//Create clear button 
const clearButton = document.createElement("button");
clearButton.textContent = "Clear";
clearButton.id = "clearButton";

// Append elements
app.appendChild(titleElement);
app.appendChild(canvasElement);
app.appendChild(clearButton);

// Get the canvas rendering context
const render = canvasElement.getContext("2d")!;
let drawing = false;

//Track all the lines drawn
const lines: {x: number, y: number}[][] = [];
const currentLine: {x: number, y: number}[] = [];

//Handle Drawing Events
canvasElement.addEventListener("mousedown", (event) => {
  drawing = true;
  render.beginPath();
  render.moveTo(event.offsetX, event.offsetY);
});

canvasElement.addEventListener("mousemove", (event) => {
  if (drawing) {
    render.lineTo(event.offsetX, event.offsetY);
    render.stroke();
  }
});

canvasElement.addEventListener("mouseup", () => {
    if (drawing) {
      drawing = false;
      lines.push(currentLine);  // Push stroke to strokes array
      canvasElement.dispatchEvent(new Event("drawing-changed")); 
    }
  });
  
  // Redraw canvas
  canvasElement.addEventListener("drawing-changed", () => {
    lines.forEach((line) => {
        render.beginPath();
        render.moveTo(line[0].x, line[0].y);
        line.forEach((point) => {
            render.lineTo(point.x, point.y);
        });
        render.stroke();
    });
  });

clearButton.addEventListener("click", () => {
  render.clearRect(0, 0, canvasElement.width, canvasElement.height);
});