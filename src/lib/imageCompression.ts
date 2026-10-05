'use client';

/**
 * Compressão de imagens no navegador (mesma abordagem canvas usada no cadastro de produtos).
 * Redimensiona mantendo proporção e reexporta como WebP (quando suportado) ou JPEG.
 */
export interface CompressImageOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number; // 0..1
  maxInputBytes: number; // tamanho máximo do arquivo original aceito
  maxOutputBytes?: number; // se o resultado passar disso, reduz qualidade/dimensão progressivamente
}

export const AVATAR_COMPRESSION: CompressImageOptions = {
  maxWidth: 256,
  maxHeight: 256,
  quality: 0.8,
  maxInputBytes: 10 * 1024 * 1024,
  maxOutputBytes: 60 * 1024, // ~60KB em base64 é mais que suficiente para avatar
};

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function supportsWebP(): boolean {
  try {
    const c = document.createElement('canvas');
    c.width = 1;
    c.height = 1;
    return c.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    return false;
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Falha ao processar arquivo de imagem.'));
    img.src = src;
  });
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Erro ao ler arquivo.'));
    reader.readAsDataURL(file);
  });
}

/** Tamanho aproximado em bytes do conteúdo de um data URL (string armazenada no banco). */
export function dataUrlSize(dataUrl: string): number {
  return dataUrl.length;
}

export async function compressImageFile(file: File, opts: CompressImageOptions): Promise<string> {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new Error('Formato inválido. Use JPG, PNG ou WEBP.');
  }
  if (file.size > opts.maxInputBytes) {
    throw new Error(`A imagem original deve ter no máximo ${Math.round(opts.maxInputBytes / (1024 * 1024))}MB.`);
  }

  const original = await readAsDataURL(file);
  const img = await loadImage(original);
  const mime = supportsWebP() ? 'image/webp' : 'image/jpeg';

  let maxW = opts.maxWidth;
  let maxH = opts.maxHeight;
  let quality = opts.quality;
  let result = original;

  // Até 5 tentativas reduzindo qualidade/dimensão para caber em maxOutputBytes
  for (let attempt = 0; attempt < 5; attempt++) {
    let width = img.width;
    let height = img.height;
    if (width > height) {
      if (width > maxW) {
        height = Math.round((height * maxW) / width);
        width = maxW;
      }
    } else if (height > maxH) {
      width = Math.round((width * maxH) / height);
      height = maxH;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) break;
    if (mime === 'image/jpeg') {
      // JPEG não tem transparência: fundo branco evita PNGs transparentes ficarem pretos
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
    }
    ctx.drawImage(img, 0, 0, width, height);
    result = canvas.toDataURL(mime, quality);

    if (!opts.maxOutputBytes || dataUrlSize(result) <= opts.maxOutputBytes) break;
    quality = Math.max(0.5, quality - 0.1);
    maxW = Math.round(maxW * 0.8);
    maxH = Math.round(maxH * 0.8);
  }

  if (opts.maxOutputBytes && dataUrlSize(result) > opts.maxOutputBytes * 2) {
    throw new Error('Não foi possível comprimir a imagem o suficiente. Tente outra foto.');
  }
  return result;
}
