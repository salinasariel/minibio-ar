// Extrae dos colores dominantes de una imagen (para sugerir el degradado).
// Muestrea la imagen reducida y elige los 2 buckets de tono más presentes,
// priorizando colores saturados (ignora grises y casi-blancos/negros).
export function extractColors(imageSrc) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const size = 64;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);

        // Buckets de 30° de tono
        const buckets = new Map();
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255;
          const max = Math.max(r, g, b), min = Math.min(r, g, b);
          const l = (max + min) / 2;
          const d = max - min;
          if (d < 0.12 || l < 0.12 || l > 0.92) continue; // gris / muy oscuro / muy claro
          let h;
          if (max === r) h = ((g - b) / d) % 6;
          else if (max === g) h = (b - r) / d + 2;
          else h = (r - g) / d + 4;
          h = Math.round((h * 60 + 360) % 360);
          const s = d / (1 - Math.abs(2 * l - 1));
          const key = Math.floor(h / 30);
          const cur = buckets.get(key) || { weight: 0, h: 0, s: 0, l: 0, n: 0 };
          cur.weight += s; // pondera por saturación
          cur.h += h; cur.s += s; cur.l += l; cur.n += 1;
          buckets.set(key, cur);
        }

        const sorted = [...buckets.values()].sort((a, b) => b.weight - a.weight);
        if (sorted.length === 0) return resolve(null);

        const toHex = ({ h, s, l, n }) => {
          const H = h / n, S = Math.min(0.85, Math.max(0.45, s / n)), L = Math.min(0.6, Math.max(0.35, l / n));
          const k = (x) => (x + H / 30) % 12;
          const a = S * Math.min(L, 1 - L);
          const f = (x) => {
            const c = L - a * Math.max(-1, Math.min(k(x) - 3, Math.min(9 - k(x), 1)));
            return Math.round(255 * c).toString(16).padStart(2, '0');
          };
          return `#${f(0)}${f(8)}${f(4)}`;
        };

        const from = toHex(sorted[0]);
        // Segundo color: siguiente bucket, o el mismo tono más oscuro
        const to = sorted[1]
          ? toHex(sorted[1])
          : toHex({ ...sorted[0], l: sorted[0].l * 0.55 });

        resolve({ from, to });
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => reject(new Error('No se pudo leer la imagen'));
    img.src = imageSrc;
  });
}

// Comprime una imagen en el navegador: la reduce a maxDim px y la
// exporta como JPEG data-URL (~50-150KB), lista para guardar en la API.
export function compressImage(file, maxDim = 800, quality = 0.72) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('El archivo debe ser una imagen'));
    }

    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      // Fondo blanco por si el PNG tiene transparencia (JPEG no la soporta)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL('image/jpeg', quality));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo leer la imagen'));
    };

    img.src = url;
  });
}
