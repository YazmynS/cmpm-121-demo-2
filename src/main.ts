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

// Create clear button 
const clearButton = document.createElement("button");
clearButton.textContent = "Clear";
clearButton.id = "clearButton";

// Create Undo Button
const undoButton = document.createElement("button");
undoButton.textContent = "Undo";
undoButton.id = "undoButton";

// Create Redo Button
const redoButton = document.createElement("button");
redoButton.textContent = "Redo";
redoButton.id = "redoButton";

// Create Button Container
const buttonContainer = document.createElement("div");
buttonContainer.id = "buttonContainer";

// Create Thin Button
const thinMarkerButton = document.createElement("button");
thinMarkerButton.textContent = "Thin Marker";
thinMarkerButton.id = "thinButton";

// Create Thick Button
const thickMarkerButton = document.createElement("button");
thickMarkerButton.textContent = "Thick Marker";
thickMarkerButton.id = "thickButton";

// Create Animal Stickers
const bearButton = document.createElement("button");
bearButton.textContent = "🐻";  // Bear emoji
bearButton.id = "bearButton";

const catButton = document.createElement("button");
catButton.textContent = "🐱";  // Cat emoji
catButton.id = "catButton";

const unicornButton = document.createElement("button");
unicornButton.textContent = "🦄";  // Surprise: Unicorn emoji
unicornButton.id = "unicornButton";

// Create Stick Container
const stickerContainer = document.createElement("div");
stickerContainer.id = "stickerContainer";

// Append elements
app.appendChild(titleElement);
app.appendChild(canvasElement);
buttonContainer.appendChild(clearButton);
buttonContainer.appendChild(undoButton);
buttonContainer.appendChild(redoButton);

buttonContainer.appendChild(thinMarkerButton);
buttonContainer.appendChild(thickMarkerButton);

// Append the sticker buttons to the sticker container
stickerContainer.appendChild(bearButton);
stickerContainer.appendChild(catButton);
stickerContainer.appendChild(unicornButton);

app.appendChild(buttonContainer);
app.appendChild(stickerContainer);

// Get the canvas rendering context
const render = canvasElement.getContext("2d")!;
let drawing = false;
let currentLineWidth = 2; // Default to "thin" marker
let currentSticker: string | null = null; // To store the selected sticker
let stickerPreview: StickerPreview | null = null; // Sticker preview object

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

// Add the missing ToolPreview class here
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

// StickerPreview class for rendering preview of selected sticker
class StickerPreview {
  private x: number;
  private y: number;
  private sticker: string;

  constructor(x: number, y: number, sticker: string) {
    this.x = x;
    this.y = y;
    this.sticker = sticker;
  }

  updatePosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.sticker, this.x, this.y);
  }
}

// StickerCommand class for placing stickers
class StickerCommand {
  private x: number;
  private y: number;
  private sticker: string;

  constructor(x: number, y: number, sticker: string) {
    this.x = x;
    this.y = y;
    this.sticker = sticker;
  }

  drag(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.sticker, this.x, this.y);
  }
}

// Global state
let lines: (MarkerLine | StickerCommand)[] = [];
let currentLine: MarkerLine | null = null;  // Current line being drawn
let redo: (MarkerLine | StickerCommand)[] = [];
let toolPreview: ToolPreview | null = null;  // Tool preview object

// Handle sticker selection and fire tool-moved event for preview
bearButton.addEventListener("click", () => {
  currentSticker = "🐻";  // Bear emoji
  stickerPreview = new StickerPreview(0, 0, currentSticker);
  canvasElement.dispatchEvent(new Event("tool-moved"));  // Trigger the preview
});

catButton.addEventListener("click", () => {
  currentSticker = "🐱";  // Cat emoji
  stickerPreview = new StickerPreview(0, 0, currentSticker);
  canvasElement.dispatchEvent(new Event("tool-moved"));  // Trigger the preview
});

unicornButton.addEventListener("click", () => {
  currentSticker = "🦄";  // Unicorn emoji
  stickerPreview = new StickerPreview(0, 0, currentSticker);
  canvasElement.dispatchEvent(new Event("tool-moved"));  // Trigger the preview
});

// Handle mousedown event to start drawing or place sticker
canvasElement.addEventListener("mousedown", (event) => {
  if (currentSticker) {
    // Place the sticker at the clicked position
    const stickerCommand = new StickerCommand(event.offsetX, event.offsetY, currentSticker);
    lines.push(stickerCommand);  // Add the sticker to the list of drawn items
    currentSticker = null;  // Reset the current sticker after placing
    stickerPreview = null;  // Hide the sticker preview after placing
    canvasElement.dispatchEvent(new Event("drawing-changed"));  // Trigger a redraw
  } else {
    // Handle normal line drawing (as before)
    drawing = true;
    toolPreview = null;  // Hide the tool preview when drawing starts
    currentLine = new MarkerLine(event.offsetX, event.offsetY, currentLineWidth);
  }
});

// Handle mousemove event to continue drawing or update the preview
canvasElement.addEventListener("mousemove", (event) => {
  if (drawing && currentLine) {
    // Extend the current line as the mouse moves
    currentLine.drag(event.offsetX, event.offsetY);
    canvasElement.dispatchEvent(new Event("drawing-changed")); // Trigger live redraw
  } else if (!drawing) {
  // If not drawing, update the tool preview or sticker preview
  if (currentSticker && stickerPreview) {
    stickerPreview.updatePosition(event.offsetX, event.offsetY);
    canvasElement.dispatchEvent(new Event("tool-moved"));  // Trigger the preview
  } else if (!toolPreview) {
    toolPreview = new ToolPreview(event.offsetX, event.offsetY, currentLineWidth);
  } else {
    toolPreview.updatePosition(event.offsetX, event.offsetY);
  }
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

// Redraw canvas when drawing or undo/redo is triggered
canvasElement.addEventListener("drawing-changed", () => {
render.clearRect(0, 0, canvasElement.width, canvasElement.height);  // Clear the canvas
lines.forEach((line) => {
  line.display(render);  // Redraw each line or sticker on the canvas
});

// Draw tool preview or sticker preview if not drawing
if (!drawing && toolPreview) {
  toolPreview.draw(render);
} else if (stickerPreview) {
  stickerPreview.draw(render);
}
});

// Handle Clear Button Functionality
clearButton.addEventListener("click", () => {
render.clearRect(0, 0, canvasElement.width, canvasElement.height);
lines = [];  // Clear all lines and stickers
redo = [];   // Clear the redo stack
canvasElement.dispatchEvent(new Event("drawing-changed"));
});

// Handle Undo Button Functionality
undoButton.addEventListener("click", () => {
if (lines.length > 0) {
  const lastStroke = lines.pop();  // Remove the last line or sticker
  redo.push(lastStroke!);  // Add it to the redo stack
  canvasElement.dispatchEvent(new Event("drawing-changed"));  // Trigger canvas redraw
}
});

// Handle Redo Button Functionality
redoButton.addEventListener("click", () => {
if (redo.length > 0) {
  const redoStroke = redo.pop();  // Retrieve the last undone stroke or sticker
  lines.push(redoStroke!);  // Add it back to the lines array
  canvasElement.dispatchEvent(new Event("drawing-changed"));  // Trigger canvas redraw
}
});

// Handle Thin Button Functionality
thinMarkerButton.addEventListener("click", () => {
currentLineWidth = 1;  // Thin marker width
thinMarkerButton.classList.add("selectedTool");
thickMarkerButton.classList.remove("selectedTool");
});

// Handle Thick Button Functionality
thickMarkerButton.addEventListener("click", () => {
currentLineWidth = 20;  // Thick marker width
thickMarkerButton.classList.add("selectedTool");
thinMarkerButton.classList.remove("selectedTool");
});

// Redraw canvas when drawing or undo/redo is triggered
canvasElement.addEventListener("drawing-changed", () => {
render.clearRect(0, 0, canvasElement.width, canvasElement.height);  // Clear the canvas
lines.forEach((line) => {
  line.display(render);  // Redraw each line or sticker on the canvas
});

// Draw tool preview or sticker preview if not drawing
if (!drawing && toolPreview) {
  toolPreview.draw(render);
} else if (stickerPreview) {
  stickerPreview.draw(render);
}
});
