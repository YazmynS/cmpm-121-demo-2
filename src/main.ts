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

// Append both elements
app.appendChild(titleElement);
app.appendChild(canvasElement);