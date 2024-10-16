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

const render = canvasElement.getContext("2d")!;
let drawing = false;

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

clearButton.addEventListener("click", () => {
  render.clearRect(0, 0, canvasElement.width, canvasElement.height);
});