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

//Create Undo Button
const undoButton = document.createElement("button");
undoButton.textContent = "Undo";
undoButton.id = "undoButton";

//Create Redo Button
const redoButton = document.createElement("button");
redoButton.textContent = "Redo";
redoButton.id = "redoButton";

//Create Button Container
const buttonContainer = document.createElement("div");
buttonContainer.id = "buttonContainer";



// Append elements
app.appendChild(titleElement);
app.appendChild(canvasElement);
buttonContainer.appendChild(clearButton);
buttonContainer.appendChild(undoButton);
buttonContainer.appendChild(redoButton);
app.appendChild(buttonContainer);

// Get the canvas rendering context
const render = canvasElement.getContext("2d")!;
let drawing = false;

//Track all the lines drawn
let lines: {x: number, y: number}[][] = [];
let currentLine: {x: number, y: number}[] = [];
let redo: {x: number, y: number}[][] = [];

//Handle Drawing Events
canvasElement.addEventListener("mousedown", (event) => {
  drawing = true;
  currentLine =[];
  render.beginPath();
  render.moveTo(event.offsetX, event.offsetY);
});

canvasElement.addEventListener("mousemove", (event) => {
    if (drawing) {
      currentLine.push({x: event.offsetX, y: event.offsetY});
      render.lineTo(event.offsetX, event.offsetY);
      render.stroke();
    }
  });
  

canvasElement.addEventListener("mouseup", () => {
    if (drawing) {
      drawing = false;
      lines.push(currentLine);  // Push stroke to strokes array
      redo = [];
      canvasElement.dispatchEvent(new Event("drawing-changed")); 
    }
});
  
// Redraw canvas
canvasElement.addEventListener("drawing-changed", () => {
    render.clearRect(0, 0, canvasElement.width, canvasElement.height);  // Clear the canvas
  
    lines.forEach((line) => {
      render.beginPath();
      render.moveTo(line[0].x, line[0].y);
      
      line.forEach((point) => {
        render.lineTo(point.x, point.y);
      });
      
      render.stroke();
    });
  });
  
  
//Handle Clear Buttton Functionality
clearButton.addEventListener("click", () => {
    render.clearRect(0, 0, canvasElement.width, canvasElement.height);
    lines = [];
    redo = [];
    canvasElement.dispatchEvent(new Event("drawing-changed"));
});

//Handle Undo Buttom Functionality
undoButton.addEventListener("click", () => {
    if (lines.length > 0) {
      const lastStroke = lines.pop();  // Remove the last stroke
      redo.push(lastStroke!);  // Add it to the redo stack
      canvasElement.dispatchEvent(new Event("drawing-changed"));  // Trigger canvas redraw
    }
  });
  
//Handle Redo Button Functionality
  redoButton.addEventListener("click", () => {
    if (redo.length > 0) {
      const redoStroke = redo.pop();  // Remove the last undone stroke
      lines.push(redoStroke!);  // Add it back to the strokes array
      canvasElement.dispatchEvent(new Event("drawing-changed"));  // Trigger canvas redraw
    }
  });