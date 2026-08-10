/**
 * Applies basic image preprocessing using an HTML5 Canvas
 * to improve OCR accuracy before passing to Tesseract.js
 */
export async function preprocessImage(imageFile: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(imageFile);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error("Could not get canvas context"));
      }

      // 1. Auto-resize (max width/height of 2000px to avoid huge images)
      const MAX_DIM = 2000;
      let width = img.width;
      let height = img.height;
      
      if (width > MAX_DIM || height > MAX_DIM) {
        if (width > height) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw original image
      ctx.drawImage(img, 0, 0, width, height);

      // Get image data for pixel manipulation
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;

      // 2. Grayscale & Contrast enhancement
      const contrast = 1.2; // 20% contrast increase
      const intercept = 128 * (1 - contrast);

      for (let i = 0; i < data.length; i += 4) {
        // Grayscale conversion (luminosity method)
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;

        // Apply contrast
        let adjusted = gray * contrast + intercept;
        
        // Clamp between 0 and 255
        adjusted = Math.max(0, Math.min(255, adjusted));

        data[i] = adjusted;     // red
        data[i + 1] = adjusted; // green
        data[i + 2] = adjusted; // blue
        // alpha (data[i + 3]) is unchanged
      }

      ctx.putImageData(imageData, 0, 0);
      
      // Return processed image as data URL (JPEG for smaller size)
      resolve(canvas.toDataURL("image/jpeg", 0.9));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image for preprocessing"));
    };

    img.src = url;
  });
}
