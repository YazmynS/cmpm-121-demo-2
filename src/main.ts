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

class ToolPreview {
  private x: number;
  private y: number;
  private lineWidth: number;

  constructor(x: number, y: number, lineWidth: number) {
    this.x = x;
    this.y = y;
    this.lineWidth = lineWidth;
  }

  updatePosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.lineWidth / 2, 0, Math.PI * 2);
    ctx.strokeStyle = "#ffffff"; // White outline for the preview
    ctx.lineWidth = 1; // The outline for the circle
    ctx.stroke();
  }
}

//Track all the lines drawn
// Global state
let lines: MarkerLine[] = [];
let currentLine: MarkerLine | null = null;  // Current line being drawn
let redo: MarkerLine[] = [];
let toolPreview: ToolPreview | null = null;  // Tool preview object

// Handle mousedown event to start drawing
canvasElement.addEventListener("mousedown", (event) => {
  drawing = true;
  toolPreview = null;  // Hide the tool preview when drawing starts
  // Initialize the current line with the starting position and current line width
  currentLine = new MarkerLine(event.offsetX, event.offsetY, currentLineWidth);
});

// Handle mousemove event to continue drawing
canvasElement.addEventListener("mousemove", (event) => {
  if (drawing && currentLine) {
    // Extend the current line as the mouse moves
    currentLine.drag(event.offsetX, event.offsetY);
    canvasElement.dispatchEvent(new Event("drawing-changed")); // Trigger live redraw
  } else if (!drawing) {
    // If not drawing, update the tool preview
    if (!toolPreview) {
      toolPreview = new ToolPreview(event.offsetX, event.offsetY, currentLineWidth);
    } else {
      toolPreview.updatePosition(event.offsetX, event.offsetY);
    }
    canvasElement.dispatchEvent(new Event("tool-moved"));
  }
});

// Handle mouseup event to complete drawing
canvasElement.addEventListener("mouseup", () => {
  if (drawing && currentLine) {
    drawing = false;
    // Push the current line to the lines array when drawing is finished
    lines.push(currentLine);
    currentLine = null;  // Reset currentLine after storing it in lines
    redo = [];  // Clear the redo stack when a new line is drawn
    canvasElement.dispatchEvent(new Event("drawing-changed")); // Trigger full redraw
  }
});

// Redraw canvas 
canvasElement.addEventListener("drawing-changed", () => {
  render.clearRect(0, 0, canvasElement.width, canvasElement.height);  // Clear canvas
  lines.forEach((line) => {
    line.display(render);  // Redraw each line on the canvas
  });

  // Draw tool preview if not drawing
  if (!drawing && toolPreview) {
    toolPreview.draw(render);
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

  // Redraw canvas when drawing or undo/redo is triggered
canvasElement.addEventListener("drawing-changed", () => {
  render.clearRect(0, 0, canvasElement.width, canvasElement.height);  // Clear the canvas
  lines.forEach((line) => {
    line.display(render);  // Redraw each line on the canvas
  });

  // Draw tool preview if not drawing
  if (!drawing && toolPreview) {
    toolPreview.draw(render);
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

