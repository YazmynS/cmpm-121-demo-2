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
let currentColor = "#000000"; // Default color is black

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

// Interfaces
interface MarkerLine {
  points: { x: number; y: number }[];
  lineWidth: number;
  color: string;
}

interface StickerPreview {
  x: number;
  y: number;
  sticker: string;
}

interface StickerCommand {
  x: number;
  y: number;
  sticker: string;
}

interface ToolPreview {
  x: number;
  y: number;
  lineWidth: number;
  color: string;
}

// Functions to create objects (factory functions)

function createMarkerLine(startX: number, startY: number, lineWidth: number, color: string): MarkerLine {
  return {
    points: [{ x: startX, y: startY }],
    lineWidth,
    color
  };
}

function createStickerPreview(x: number, y: number, sticker: string): StickerPreview {
  return { x, y, sticker };
}

function createStickerCommand(x: number, y: number, sticker: string): StickerCommand {
  return { x, y, sticker };
}

function createToolPreview(x: number, y: number, lineWidth: number, color: string): ToolPreview {
  return { x, y, lineWidth, color };
}

// Functions for handling drawing
function handleMouseDown(event: MouseEvent) {
  if (currentSticker) {
    const stickerCommand = createStickerCommand(event.offsetX, event.offsetY, currentSticker);
    lines.push(stickerCommand);
    currentSticker = null;
    stickerPreview = null;
    canvasElement.dispatchEvent(new Event("drawing-changed"));
  } else {
    drawing = true;
    toolPreview = null;
    currentLine = createMarkerLine(event.offsetX, event.offsetY, currentLineWidth, currentColor);
  }
}

function handleMouseMove(event: MouseEvent) {
  if (drawing && currentLine) {
    currentLine.points.push({ x: event.offsetX, y: event.offsetY });
    canvasElement.dispatchEvent(new Event("drawing-changed"));
  } else if (!drawing) {
    if (currentSticker && stickerPreview) {
      updateStickerPreviewPosition(stickerPreview, event.offsetX, event.offsetY);
    } else if (!toolPreview) {
      toolPreview = createToolPreview(event.offsetX, event.offsetY, currentLineWidth, currentColor);
    } else {
      updateToolPreviewPosition(toolPreview, event.offsetX, event.offsetY);
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

// Redraw the canvas
function redraw(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  lines.forEach(line => displayLineOrSticker(line, ctx));
  if (!drawing && toolPreview) drawToolPreview(toolPreview, ctx);
  if (!drawing && stickerPreview) drawStickerPreview(stickerPreview, ctx);
}

// Button and UI Creation
function createButtonContainer() {
  const container = createElement("div", { id: "buttonContainer" });

  // First group of buttons (Clear, Undo, Redo, Random Color)
  const primaryButtonContainer = createElement("div", { id: "primaryButtonContainer" });
  primaryButtonContainer.append(
    createButton("Clear", clearCanvas, "clearButton"),
    createButton("Undo", undo, "undoButton"),
    createButton("Redo", redoAction, "redoButton"),
    createButton("Color", setRandomColor, "colorButton")
  );

  // Second group of buttons (Export, Thin, Thick)
  const secondaryButtonContainer = createElement("div", { id: "secondaryButtonContainer" });
  secondaryButtonContainer.append(
    createButton("Export", exportCanvas, "exportButton"),
    createButton("Thin Marker", () => setMarkerWidth(1), "thinButton"),
    createButton("Thick Marker", () => setMarkerWidth(10), "thickButton")
  );

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

  // Update tool preview with selected size and current color
  toolPreview = createToolPreview(50, 50, currentLineWidth, currentColor);
  canvasElement.dispatchEvent(new Event("drawing-changed"));
}

function setRandomColor() {
  const randomColor = getRandomColor();
  currentColor = randomColor;
  
  // Update tool preview with the new color and current line width
  toolPreview = createToolPreview(50, 50, currentLineWidth, currentColor);
  
  // Redraw the canvas to show the updated tool preview
  canvasElement.dispatchEvent(new Event("drawing-changed"));
}

function getRandomColor() {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function selectSticker(emoji: string) {
  currentSticker = emoji;
  stickerPreview = createStickerPreview(0, 0, currentSticker);
}

function addCustomSticker() {
  const customSticker = prompt("Enter a new sticker (emoji or text):", "😀");
  if (customSticker) selectSticker(customSticker);
}

function exportCanvas() {
  const exportCanvas = createCanvas(EXPORT_CANVAS_SIZE, EXPORT_CANVAS_SIZE);
  const exportCtx = exportCanvas.getContext("2d")!;
  exportCtx.scale(4, 4); // Scale up the drawing to export at higher resolution
  lines.forEach(line => displayLineOrSticker(line, exportCtx));
  const link = createElement("a", { href: exportCanvas.toDataURL("image/png"), download: "drawing.png" });
  link.click();
}

// Functions to update or display objects

function updateStickerPreviewPosition(preview: StickerPreview, x: number, y: number) {
  preview.x = x;
  preview.y = y;
}

function drawStickerPreview(preview: StickerPreview, ctx: CanvasRenderingContext2D) {
  ctx.font = '40px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(preview.sticker, preview.x, preview.y);
}

function updateToolPreviewPosition(preview: ToolPreview, x: number, y: number) {
  preview.x = x;
  preview.y = y;
}

function drawToolPreview(preview: ToolPreview, ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  ctx.arc(preview.x, preview.y, preview.lineWidth / 2, 0, Math.PI * 2);
  ctx.fillStyle = preview.color;
  ctx.fill();
  ctx.strokeStyle = "#000000"; // Black outline for tool preview
  ctx.lineWidth = 1;
  ctx.stroke();
}

function displayLineOrSticker(item: MarkerLine | StickerCommand, ctx: CanvasRenderingContext2D) {
  if ("points" in item) {
    displayLine(item, ctx); // It's a MarkerLine
  } else {
    displayStickerCommand(item, ctx); // It's a StickerCommand
  }
}

function displayLine(line: MarkerLine, ctx: CanvasRenderingContext2D) {
  if (line.points.length < 2) return;
  ctx.lineWidth = line.lineWidth;
  ctx.strokeStyle = line.color;
  ctx.beginPath();
  ctx.moveTo(line.points[0].x, line.points[0].y);

  for (let i = 1; i < line.points.length; i++) {
    ctx.lineTo(line.points[i].x, line.points[i].y);
  }

  ctx.stroke();
}

function displayStickerCommand(command: StickerCommand, ctx: CanvasRenderingContext2D) {
  ctx.font = '40px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(command.sticker, command.x, command.y);
}
