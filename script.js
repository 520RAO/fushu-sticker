const templateButtons = document.querySelectorAll(".template-card");
const previewImage = document.querySelector("#previewImage");
const caption = document.querySelector("#caption");
const captionInput = document.querySelector("#captionInput");
const positionButtons = document.querySelectorAll(".segmented button");
const downloadButton = document.querySelector("#downloadButton");
const copyButton = document.querySelector("#copyButton");
const toast = document.querySelector("#toast");

const exportState = {
  imagePath: "./images/opossum-1.webp",
  position: "middle",
};

const positionMap = {
  top: 0.42,
  middle: 0.62,
  bottom: 0.82,
};

function setActiveButton(buttons, activeButton) {
  buttons.forEach((button) => {
    button.classList.toggle("is-active", button === activeButton);
  });
}

function syncCaptionText() {
  const inputText = captionInput.value.trim();
  caption.textContent = inputText || " ";
}

function switchTemplate(clickedButton) {
  const imagePath = clickedButton.dataset.image;
  exportState.imagePath = imagePath;
  previewImage.src = imagePath;
  setActiveButton(templateButtons, clickedButton);
}

function switchCaptionPosition(clickedButton) {
  const position = clickedButton.dataset.position;
  exportState.position = position;

  caption.classList.remove("position-top", "position-middle", "position-bottom");
  caption.classList.add(`position-${position}`);
  setActiveButton(positionButtons, clickedButton);
}

function loadImage(imagePath) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = imagePath;
  });
}

function getCaptionLines() {
  return captionInput.value
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 3);
}

async function createStickerCanvas() {
  const size = 1024;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const image = await loadImage(exportState.imagePath);

  canvas.width = size;
  canvas.height = size;

  const imageRatio = image.naturalWidth / image.naturalHeight;
  let drawWidth = size;
  let drawHeight = size;
  let drawX = 0;
  let drawY = 0;

  if (imageRatio > 1) {
    drawHeight = size;
    drawWidth = size * imageRatio;
    drawX = (size - drawWidth) / 2;
  } else {
    drawWidth = size;
    drawHeight = size / imageRatio;
    drawY = (size - drawHeight) / 2;
  }

  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);

  const lines = getCaptionLines();
  if (lines.length > 0) {
    const fontSize = 86;
    const lineHeight = fontSize * 1.18;
    const centerY = size * positionMap[exportState.position];
    const startY = centerY - ((lines.length - 1) * lineHeight) / 2;

    ctx.font = `800 ${fontSize}px "Helvetica Neue", Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";

    lines.forEach((line, index) => {
      const y = startY + index * lineHeight;

      ctx.lineWidth = 10;
      ctx.strokeStyle = "black";
      ctx.strokeText(line, size / 2, y);

      ctx.fillStyle = "white";
      ctx.fillText(line, size / 2, y);
    });
  }

  return canvas;
}

function canvasToPngBlob(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, "image/png");
  });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");

  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 1800);
}

async function downloadSticker() {
  const canvas = await createStickerCanvas();
  const imageUrl = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  const fileText = captionInput.value.trim().replace(/\s+/g, "-").slice(0, 10) || "sticker";

  link.href = imageUrl;
  link.download = `复鼠表情包-${fileText}.png`;
  link.click();
  showToast("图片已开始下载");
}

async function copySticker() {
  try {
    if (!navigator.clipboard || !window.ClipboardItem) {
      showToast("当前浏览器不支持复制图片，请使用下载");
      return;
    }

    const canvas = await createStickerCanvas();
    const blob = await canvasToPngBlob(canvas);

    if (!blob) {
      showToast("图片生成失败，请重试");
      return;
    }

    await navigator.clipboard.write([
      new ClipboardItem({
        "image/png": blob,
      }),
    ]);

    showToast("已复制到剪贴板");
  } catch (error) {
    console.error(error);
    showToast("复制失败，请使用下载");
    return;
  }
}

templateButtons.forEach((button) => {
  button.addEventListener("click", () => {
    switchTemplate(button);
  });
});

positionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    switchCaptionPosition(button);
  });
});

captionInput.addEventListener("input", syncCaptionText);
downloadButton.addEventListener("click", downloadSticker);
copyButton.addEventListener("click", copySticker);
caption.classList.add("position-middle");
syncCaptionText();
