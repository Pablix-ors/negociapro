const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generateFavicon() {
  const svgPath = path.join(__dirname, 'public', 'icon.svg');
  const svgBuffer = fs.readFileSync(svgPath);

  // 1. Gerar icon.png (32x32)
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(__dirname, 'src', 'app', 'icon.png'));

  // 2. Gerar favicon.ico real (32x32 png compatível)
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(__dirname, 'src', 'app', 'favicon.ico'));

  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(__dirname, 'public', 'favicon.ico'));

  // 3. Gerar apple-icon.png (180x180)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(__dirname, 'src', 'app', 'apple-icon.png'));

  // 4. Gerar ícones PWA oficiais exigidos pelo Chrome (192x192 e 512x512)
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(__dirname, 'public', 'icon-192.png'));

  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(__dirname, 'public', 'icon-512.png'));

  // 5. Gerar logo de alta resolução para branding
  await sharp(svgBuffer)
    .resize(256, 256)
    .png()
    .toFile(path.join(__dirname, 'public', 'logo.png'));

  console.log('✅ Favicon .ico, .png e logo gerados com sucesso!');
}

generateFavicon().catch(console.error);
