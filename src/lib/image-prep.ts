// Shrinks a photo in the browser so reference uploads stay small and fast.
export async function fileToDataUrl(file: Blob, max = 1280, quality = 0.88): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not read that photo"));
      el.src = url;
    });
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function urlToFile(src: string, name: string): Promise<File> {
  const res = await fetch(src);
  if (!res.ok) throw new Error("Could not load the image");
  const blob = await res.blob();
  const type = blob.type || "image/jpeg";
  const ext = (type.split("/")[1] || "jpg").replace("jpeg", "jpg");
  return new File([blob], `${name}.${ext}`, { type });
}
