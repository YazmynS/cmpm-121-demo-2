import "./style.css";

// Constants
const APP_NAME = "Draw";
const CANVAS_SIZE = 256;
const EXPORT_CANVAS_SIZE = 1024;
const STICKERS = [
  { id: "bearButton", emoji: "🐻" },
  { id: "catButton", emoji: "🐱" },
  { id: "unicornButton", emoji: "🦄" }
];

// Global Variables
let drawing = false;
let currentLine: MarkerLine | null = null;
let currentLineWidth = 2;
let currentSticker: string | null = null;
let stickerPreview: StickerPreview | null = null;
let toolPreview: ToolPreview | null = null;
let lines: (MarkerLine | StickerCommand)[] = [];
let redo: (MarkerLine | StickerCommand)[] = [];

// Get the canvas rendering context
const canvasElement = createCanvas(CANVAS_SIZE, CANVAS_SIZE);
const render = canvasElement.getContext("2d")!;

// Setup App
document.title = APP_NAME;
document.querySelector<HTMLDivElement>("#app")!.append(
  createElement("h1", { textContent: APP_NAME }),
  canvasElement,
  createButtonContainer(),
  createStickerContainer()
);

// Event Listeners for Drawing
canvasElement.addEventListener("mousedown", handleMouseDown);
canvasElement.addEventListener("mousemove", handleMouseMove);
canvasElement.addEventListener("mouseup", handleMouseUp);
canvasElement.addEventListener("drawing-changed", () => redraw(render));

// Functions

function handleMouseDown(event: MouseEvent) {
  if (currentSticker) {
    const stickerCommand = new StickerCommand(event.offsetX, event.offsetY, currentSticker);
    lines.push(stickerCommand);
    currentSticker = null;
    stickerPreview = null;
    canvasElement.dispatchEvent(new Event("drawing-changed"));
  } else {
    drawing = true;
    toolPreview = null;
    currentLine = new MarkerLine(event.offsetX, event.offsetY, currentLineWidth);
  }
}

function handleMouseMove(event: MouseEvent) {
  if (drawing && currentLine) {
    currentLine.drag(event.offsetX, event.offsetY);
    canvasElement.dispatchEvent(new Event("drawing-changed"));
  } else if (!drawing) {
    if (currentSticker && stickerPreview) {
      stickerPreview.updatePosition(event.offsetX, event.offsetY);
    } else if (!toolPreview) {
      toolPreview = new ToolPreview(event.offsetX, event.offsetY, currentLineWidth);
    } else {
      toolPreview.updatePosition(event.offsetX, event.offsetY);
    }
    canvasElement.dispatchEvent(new Event("tool-moved"));
  }
}

function handleMouseUp() {
  if (drawing && currentLine) {
    drawing = false;
    lines.push(currentLine);
    currentLine = null;
    redo = [];
    canvasElement.dispatchEvent(new Event("drawing-changed"));
  }
}

function redraw(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  lines.forEach(line => line.display(ctx));
  if (!drawing && toolPreview) toolPreview.draw(ctx);
  if (!drawing && stickerPreview) stickerPreview.draw(ctx);
}

function createButtonContainer() {
  const container = createElement("div", { id: "buttonContainer" });

  // First group of buttons (Clear, Undo, Redo)
  const primaryButtonContainer = createElement("div", { id: "primaryButtonContainer" });
  primaryButtonContainer.append(
    createButton("Clear", clearCanvas, "clearButton"),
    createButton("Undo", undo, "undoButton"),
    createButton("Redo", redoAction, "redoButton")
  );

  // Second group of buttons (Export, Thin, Thick)
  const secondaryButtonContainer = createElement("div", { id: "secondaryButtonContainer" });
  secondaryButtonContainer.append(
    createButton("Export", exportCanvas, "exportButton"),
    createButton("Thin Marker", () => setMarkerWidth(1), "thinButton"),
    createButton("Thick Marker", () => setMarkerWidth(10), "thickButton")
  );

  // Append both groups to the main container
  container.append(primaryButtonContainer, secondaryButtonContainer);
  return container;
}

function createStickerContainer() {
  const container = createElement("div", { id: "stickerContainer" });
  STICKERS.forEach(sticker => {
    container.append(createButton(sticker.emoji, () => selectSticker(sticker.emoji), sticker.id));
  });
  container.append(createButton("Add Custom Sticker", addCustomSticker, "customButton"));
  return container;
}

// Helper Functions

function createCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.id = "gameCanvas";
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attributes: Partial<HTMLElementTagNameMap[K]> = {}
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  Object.assign(element, attributes);
  return element;
}

function createButton(text: string, onClick: () => void, id?: string) {
  const button = createElement("button", { textContent: text });
  if (id) button.id = id;
  button.addEventListener("click", onClick);
  return button;
}

function clearCanvas() {
  lines = [];
  redo = [];
  canvasElement.dispatchEvent(new Event("drawing-changed"));
}

function undo() {
  if (lines.length > 0) {
    redo.push(lines.pop()!);
    canvasElement.dispatchEvent(new Event("drawing-changed"));
  }
}

function redoAction() {
  if (redo.length > 0) {
    lines.push(redo.pop()!);
    canvasElement.dispatchEvent(new Event("drawing-changed"));
  }
}

function setMarkerWidth(width: number) {
  currentLineWidth = width;
  document.querySelectorAll("button").forEach(btn => btn.classList.remove("selectedTool"));
  const selectedButton = width === 1 ? document.getElementById("thinButton") : document.getElementById("thickButton");
  selectedButton?.classList.add("selectedTool");
}

function selectSticker(emoji: string) {
  currentSticker = emoji;
  stickerPreview = new StickerPreview(0, 0, currentSticker);
}

function addCustomSticker() {
  const customSticker = prompt("Enter a new sticker (emoji or text):", "😀");
  if (customSticker) selectSticker(customSticker);
}

function exportCanvas() {
  const exportCanvas = createCanvas(EXPORT_CANVAS_SIZE, EXPORT_CANVAS_SIZE);
  const exportCtx = exportCanvas.getContext("2d")!;
  exportCtx.scale(4, 4);
  lines.forEach(line => line.display(exportCtx));
  const link = createElement("a", { href: exportCanvas.toDataURL("image/png"), download: "drawing.png" });
  link.click();
}

// MarkerLine Class
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
    ctx.strokeStyle = "#000000";
    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);

    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }

    ctx.stroke();
  }
}

// ToolPreview Class
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

// StickerPreview Class
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

// StickerCommand Class
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
