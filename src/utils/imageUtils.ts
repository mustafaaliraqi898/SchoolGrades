/**
 * Image processing utilities for school logo upload and compression.
 * Resizes large images to maintain high print fidelity while keeping
 * localStorage footprint minimal (typically under 40KB-70KB).
 */

export interface ProcessedLogoResult {
  dataUrl: string;
  width: number;
  height: number;
  sizeKb: number;
  format: string;
}

export function processLogoFile(file: File): Promise<ProcessedLogoResult> {
  return new Promise((resolve, reject) => {
    const validMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validMimes.includes(file.type.toLowerCase())) {
      return reject(
        new Error('صيغة الملف غير مدعومة. يرجى اختيار صورة بصيغة PNG أو JPG أو JPEG أو WebP.')
      );
    }

    // Safety check on raw file size (e.g. max 15MB before processing)
    if (file.size > 15 * 1024 * 1024) {
      return reject(new Error('حجم ملف الصورة كبير جداً، يرجى اختيار ملف أصغر من 15 ميغابايت.'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('حدث خطأ أثناء قراءة ملف الصورة.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('تعذر تحميل الصورة أو أن الملف تالف.'));
      img.onload = () => {
        // Target dimension: 360px max dimension
        // At 300 DPI, 360px equals ~3cm x 3cm on printed A4 paper (crystal clear print quality).
        const MAX_DIM = 360;
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width <= 0 || height <= 0) {
          return reject(new Error('أبعاد الصورة غير صالحة.'));
        }

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('تعذر إنشاء سياق معالجة الصورة.'));
        }

        // Apply high quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Keep PNG transparency if PNG, else use WebP or JPEG
        const isPng = file.type === 'image/png';
        const mimeType = isPng ? 'image/png' : 'image/webp';
        const dataUrl = canvas.toDataURL(mimeType, 0.90);

        // Approximate size in KB
        const sizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);

        resolve({
          dataUrl,
          width,
          height,
          sizeKb,
          format: isPng ? 'PNG (مع شفافية)' : 'WebP / JPG',
        });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Image processing utilities for A4 Landscape Certificate Template.
 * Resizes large high-res templates to standard crisp resolution (max 1800px wide)
 * to guarantee crystal-clear print output while fitting comfortably in storage (~120KB-250KB).
 */
export function processTemplateImage(file: File): Promise<ProcessedLogoResult> {
  return new Promise((resolve, reject) => {
    const validMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validMimes.includes(file.type.toLowerCase())) {
      return reject(
        new Error('صيغة الملف غير مدعومة. يرجى اختيار قالب بصيغة PNG أو JPG أو JPEG أو WebP.')
      );
    }

    if (file.size > 25 * 1024 * 1024) {
      return reject(new Error('حجم ملف قالب الشهادة كبير جداً، يرجى اختيار ملف أصغر من 25 ميغابايت.'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('حدث خطأ أثناء قراءة ملف القالب.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('تعذر تحميل صورة القالب أو أن الملف تالف.'));
      img.onload = () => {
        // High fidelity dimension for A4 Landscape
        const MAX_WIDTH = 1800;
        const MAX_HEIGHT = 1273;
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width <= 0 || height <= 0) {
          return reject(new Error('أبعاد صورة القالب غير صالحة.'));
        }

        // Scale down if exceeds maximum limits
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('تعذر إنشاء سياق معالجة صورة القالب.'));
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const isPng = file.type === 'image/png';
        const mimeType = isPng ? 'image/png' : 'image/jpeg';
        const quality = isPng ? 0.92 : 0.88;
        const dataUrl = canvas.toDataURL(mimeType, quality);

        const sizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);

        resolve({
          dataUrl,
          width,
          height,
          sizeKb,
          format: isPng ? 'PNG' : 'JPEG / WebP',
        });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

