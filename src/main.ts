import "./style.css";

const APP_NAME = "Games";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;

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

// Append both elements to the app div
app.appendChild(titleElement);
app.appendChild(canvasElement);