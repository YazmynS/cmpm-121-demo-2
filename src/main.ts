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

// Create Thin Button
const thinMarkerButton = document.createElement("button");
thinMarkerButton.textContent = "Thin Marker";
thinMarkerButton.id = "thinButton";

//Create Thick Button
const thickMarkerButton = document.createElement("button");
thickMarkerButton.textContent = "Thick Marker";
thickMarkerButton.id = "thickButton";

// Append elements
app.appendChild(titleElement);
app.appendChild(canvasElement);
buttonContainer.appendChild(clearButton);
buttonContainer.appendChild(undoButton);
buttonContainer.appendChild(redoButton);

buttonContainer.appendChild(thinMarkerButton);
buttonContainer.appendChild(thickMarkerButton);

app.appendChild(buttonContainer);


// Get the canvas rendering context
const render = canvasElement.getContext("2d")!;
let drawing = false;
let currentLineWidth = 2; // Default to "thin" marker


class MarkerLine {
  private points: { x: number; y: number }[] = [];
  private lineWidth: number;

  constructor(startX: number, startY: number, lineWidth: number) {
    this.points.push({ x: startX, y: startY });
    this.lineWidth = lineWidth;
  }

  // Extend the line as the mouse is dragged
  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  // Display the line on the canvas
  display(ctx: CanvasRenderingContext2D) {
    if (this.points.length < 2) return;
    ctx.lineWidth = this.lineWidth;
    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);

    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }

    ctx.stroke();
  }
}

//Track all the lines drawn
let lines: MarkerLine[] = [];
let currentLine: MarkerLine | null = null;
let redo: MarkerLine[] = [];


//Handle Drawing Events
canvasElement.addEventListener("mousedown", (event) => {
  drawing = true;
  currentLine = new MarkerLine(event.offsetX, event.offsetY, currentLineWidth);
});

canvasElement.addEventListener("mousemove", (event) => {
  if (drawing && currentLine) {
    currentLine.drag(event.offsetX, event.offsetY);
    canvasElement.dispatchEvent(new Event("drawing-changed")); // Trigger live redraw
  }
});
  

  canvasElement.addEventListener("mouseup", () => {
    if (drawing && currentLine) {
      drawing = false;
      lines.push(currentLine); // Add current line to lines stack
      currentLine = null;
      redo = []; // Clear redo stack
      canvasElement.dispatchEvent(new Event("drawing-changed")); // Trigger full redraw
    }
  });
  
// Redraw canvas
canvasElement.addEventListener("drawing-changed", () => {
  render.clearRect(0, 0, canvasElement.width, canvasElement.height); // Clear the canvas
  lines.forEach((line) => {
    line.display(render); // Display each line on the canvas
  });
  if (currentLine) {
    currentLine.display(render); // Display the current line during drawing
  }
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

  // Handle Thin Button Functionality
thinMarkerButton.addEventListener("click", () => {
  currentLineWidth = 1; // Thin marker is 2px wide
  thinMarkerButton.classList.add("selectedTool");
  thickMarkerButton.classList.remove("selectedTool");
});

// Handle Thick Button Functionality
thickMarkerButton.addEventListener("click", () => {
  currentLineWidth = 20; 
  thickMarkerButton.classList.add("selectedTool");
  thinMarkerButton.classList.remove("selectedTool");
});

