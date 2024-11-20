import "./style.css";

// Constants
const APP_NAME = "Draw";
const CANVAS_SIZE = 256;
const EXPORT_CANVAS_SIZE = 1024;
const STICKERS = [
  { id: "bearButton", emoji: "🐻" },
  { id: "catButton", emoji: "🐱" },
  { id: "unicornButton", emoji: "🦄" },
];

const canvasElement = createCanvas(CANVAS_SIZE, CANVAS_SIZE);
const render = canvasElement.getContext("2d")!;

// Global Variables
let drawing = false;
let currentLine: MarkerLine | null = null;
let currentLineWidth = 2;
let currentSticker: string | null = null;
let stickerPreview: StickerPreview | null = null;
let toolPreview: ToolPreview | null = null;
let lines: (MarkerLine | StickerCommand)[] = [];
let redo: (MarkerLine | StickerCommand)[] = [];
let currentColor = "#000000";

// App Initialization
initializeApp();

function initializeApp() {
  document.title = APP_NAME;
  setupDOM();
  setupEventListeners();
}

function setupDOM() {
  document
    .querySelector<HTMLDivElement>("#app")!
    .append(
      createElement("h1", { textContent: APP_NAME }),
      canvasElement,
      createButtonContainer(),
      createStickerContainer()
    );
}

//Handle Drawing Functionality
function setupEventListeners() {
  canvasElement.addEventListener("mousedown", handleMouseDown);
  canvasElement.addEventListener("mousemove", handleMouseMove);
  canvasElement.addEventListener("mouseup", handleMouseUp);
  canvasElement.addEventListener("drawing-changed", () => redraw(render));
}

// Create Interfaces
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

// Create Objects
function createObject<T>(properties: T): T {
  return { ...properties };
}

function createMarkerLine(
  startX: number,
  startY: number,
  lineWidth: number,
  color: string
): MarkerLine {
  return createObject<MarkerLine>({
    points: [{ x: startX, y: startY }],
    lineWidth,
    color,
  });
}

function createStickerPreview(
  x: number,
  y: number,
  sticker: string
): StickerPreview {
  return createObject<StickerPreview>({ x, y, sticker });
}

function createStickerCommand(
  x: number,
  y: number,
  sticker: string
): StickerCommand {
  return createObject<StickerCommand>({ x, y, sticker });
}

function createToolPreview(
  x: number,
  y: number,
  lineWidth: number,
  color: string
): ToolPreview {
  return createObject<ToolPreview>({ x, y, lineWidth, color });
}

// Handle Mouse Events
function handleMouseDown(event: MouseEvent) {
  currentSticker ? addStickerToCanvas(event) : startDrawing(event);
}

function handleMouseMove(event: MouseEvent) {
  drawing && currentLine ? addPointToCurrentLine(event) : updatePreviews(event);
}

function handleMouseUp() {
  if (drawing && currentLine) finishDrawing();
}

// Drawing Functions
function startDrawing(event: MouseEvent) {
  drawing = true;
  toolPreview = null;
  currentLine = createMarkerLine(
    event.offsetX,
    event.offsetY,
    currentLineWidth,
    currentColor
  );
}

function addPointToCurrentLine(event: MouseEvent) {
  currentLine!.points.push({ x: event.offsetX, y: event.offsetY });
  triggerRedraw();
}

function finishDrawing() {
  drawing = false;
  lines.push(currentLine!);
  currentLine = null;
  redo = [];
  triggerRedraw();
}

function addStickerToCanvas(event: MouseEvent) {
  const stickerCommand = createStickerCommand(
    event.offsetX,
    event.offsetY,
    currentSticker!
  );
  lines.push(stickerCommand);
  clearStickerPreview();
  triggerRedraw();
}

// Create Preview
function updatePreviews(event: MouseEvent) {
  if (currentSticker && stickerPreview) {
    updateStickerPreviewPosition(stickerPreview, event.offsetX, event.offsetY);
  } else if (!toolPreview) {
    toolPreview = createToolPreview(
      event.offsetX,
      event.offsetY,
      currentLineWidth,
      currentColor
    );
  } else {
    updateToolPreviewPosition(toolPreview, event.offsetX, event.offsetY);
  }
  canvasElement.dispatchEvent(new Event("tool-moved"));
}

// Handle Rendering
function redraw(ctx: CanvasRenderingContext2D) {
  clearCanvas(ctx);
  renderLines(ctx);
  renderPreviews(ctx);
}

function clearCanvas(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
}

function renderLines(ctx: CanvasRenderingContext2D) {
  lines.forEach((line) => displayLineOrSticker(line, ctx));
}

function renderPreviews(ctx: CanvasRenderingContext2D) {
  if (!drawing && toolPreview) drawToolPreview(toolPreview, ctx);
  if (!drawing && stickerPreview) drawStickerPreview(stickerPreview, ctx);
}

// Handle Display of Line/Sticker
function drawToolPreview(preview: ToolPreview, ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  ctx.arc(preview.x, preview.y, preview.lineWidth / 2, 0, Math.PI * 2);
  ctx.fillStyle = preview.color;
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawStickerPreview(
  preview: StickerPreview,
  ctx: CanvasRenderingContext2D
) {
  ctx.font = "40px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(preview.sticker, preview.x, preview.y);
}

function displayLineOrSticker(
  item: MarkerLine | StickerCommand,
  ctx: CanvasRenderingContext2D
) {
  if (isMarkerLine(item)) {
    displayLine(item, ctx);
  } else {
    displayStickerCommand(item, ctx);
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

function displayStickerCommand(
  command: StickerCommand,
  ctx: CanvasRenderingContext2D
) {
  ctx.font = "40px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(command.sticker, command.x, command.y);
}

// Handle Canvas Updates
function triggerRedraw() {
  canvasElement.dispatchEvent(new Event("drawing-changed"));
}

function isMarkerLine(item: MarkerLine | StickerCommand): item is MarkerLine {
  return "points" in item;
}

function clearStickerPreview() {
  currentSticker = null;
  stickerPreview = null;
}

function updateStickerPreviewPosition(
  preview: StickerPreview,
  x: number,
  y: number
) {
  preview.x = x;
  preview.y = y;
}

function updateToolPreviewPosition(preview: ToolPreview, x: number, y: number) {
  preview.x = x;
  preview.y = y;
}

//  Create Buttons
function createButtonContainer() {
  const container = createElement("div", { id: "buttonContainer" });

  const primaryButtonContainer = createElement("div", {
    id: "primaryButtonContainer",
  });
  primaryButtonContainer.append(
    createButton("Clear", clearCanvasAction, "clearButton"),
    createButton("Undo", undo, "undoButton"),
    createButton("Redo", redoAction, "redoButton"),
    createButton("Color", setRandomColor, "colorButton")
  );

  const secondaryButtonContainer = createElement("div", {
    id: "secondaryButtonContainer",
  });
  secondaryButtonContainer.append(
    createButton("Export", exportCanvas, "exportButton"),
    createButton("Thin Marker", () => setMarkerWidth(5), "thinButton"),
    createButton("Thick Marker", () => setMarkerWidth(10), "thickButton")
  );

  container.append(primaryButtonContainer, secondaryButtonContainer);
  return container;
}

function createStickerContainer() {
  const container = createElement("div", { id: "stickerContainer" });
  STICKERS.forEach((sticker) => {
    container.append(
      createButton(
        sticker.emoji,
        () => selectSticker(sticker.emoji),
        sticker.id
      )
    );
  });
  container.append(
    createButton("Add Custom Sticker", addCustomSticker, "customButton")
  );
  return container;
}

// Handle Button Functionality
function clearCanvasAction() {
  lines = [];
  redo = [];
  triggerRedraw();
}

function undo() {
  if (lines.length > 0) {
    redo.push(lines.pop()!);
    triggerRedraw();
  }
}

function redoAction() {
  if (redo.length > 0) {
    lines.push(redo.pop()!);
    triggerRedraw();
  }
}

function setMarkerWidth(width: number) {
  currentLineWidth = width;
  highlightSelectedTool(width);
  updateToolPreview();
}

function highlightSelectedTool(width: number) {
  document
    .querySelectorAll("button")
    .forEach((btn) => btn.classList.remove("selectedTool"));
  const selectedButton =
    width === 1
      ? document.getElementById("thinButton")
      : document.getElementById("thickButton");
  selectedButton?.classList.add("selectedTool");
}

function setRandomColor() {
  currentColor = getRandomColor();
  updateToolPreview();
}

function updateToolPreview() {
  toolPreview = createToolPreview(50, 50, currentLineWidth, currentColor);
  triggerRedraw();
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
  exportCtx.scale(4, 4);
  renderLines(exportCtx);
  downloadCanvas(exportCanvas);
}

function downloadCanvas(canvas: HTMLCanvasElement) {
  const link = createElement("a", {
    href: canvas.toDataURL("image/png"),
    download: "drawing.png",
  });
  link.click();
}

// Helper Functions
function getRandomColor() {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

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
