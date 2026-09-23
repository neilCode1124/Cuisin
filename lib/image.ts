export const MAX_SOURCE_BYTES = 12 * 1024 * 1024;
export const MAX_PREPARED_BYTES = 1_900_000;
export const MAX_IMAGE_EDGE = 1600;

const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export type PreparedImage = {
  dataUrl: string;
  fileName: string;
  height: number;
  bytes: number;
  width: number;
};

export async function prepareImage(file: File): Promise<PreparedImage> {
  if (!ACCEPTED_TYPES.has(file.type)) {
    throw new Error("请使用 JPG、PNG、WebP 或 HEIC 图片。");
  }

  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error("原图不能超过 12 MB，请先选择更小的图片。");
  }

  const bitmap = await decodeImage(file);
  const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { alpha: false });
  if (!context) {
    closeBitmap(bitmap);
    throw new Error("当前浏览器无法处理这张图片。");
  }

  context.fillStyle = "#f4efe4";
  context.fillRect(0, 0, width, height);
  drawBitmap(context, bitmap, width, height);
  closeBitmap(bitmap);

  let blob: Blob | null = null;
  for (const quality of [0.86, 0.78, 0.7, 0.62]) {
    blob = await canvasToBlob(canvas, quality);
    if (blob && blob.size <= MAX_PREPARED_BYTES) {
      break;
    }
  }

  if (!blob) {
    throw new Error("图片压缩失败，请换一张图片重试。");
  }

  if (blob.size > MAX_PREPARED_BYTES) {
    throw new Error("压缩后的图片仍然过大，请选择尺寸更小的图片。");
  }

  return {
    dataUrl: await blobToDataUrl(blob),
    fileName: file.name.replace(/\.[^.]+$/, "") || "dish",
    height,
    bytes: blob.size,
    width,
  };
}

type DecodedImage =
  | ImageBitmap
  | HTMLImageElement;

async function decodeImage(file: File): Promise<DecodedImage> {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(file);
    } catch {
      // Fall through to the <img> decoder for browser-specific formats.
    }
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = objectUrl;
    await image.decode();
    return image;
  } catch {
    throw new Error("无法读取这张图片，请尝试 JPG、PNG 或 WebP 格式。");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function drawBitmap(
  context: CanvasRenderingContext2D,
  bitmap: DecodedImage,
  width: number,
  height: number,
) {
  context.drawImage(bitmap, 0, 0, width, height);
}

function closeBitmap(bitmap: DecodedImage) {
  if ("close" in bitmap) {
    bitmap.close();
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", quality);
  });
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("无法准备上传数据。"));
    reader.readAsDataURL(blob);
  });
}

export function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
