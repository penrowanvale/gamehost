

const fs = require('fs');
const path = require('path');

const faviconSVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <rect width="32" height="32" fill="#ff6b35"/>
  <text x="16" y="22" font-family="Arial, sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="white">G</text>
</svg>
`;

const imagesDir = path.join(__dirname, '../public/images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

fs.writeFileSync(path.join(imagesDir, 'favicon.svg'), faviconSVG);

const imageGeneratorHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Image Generator</title>
</head>
<body>
    <canvas id="canvas" width="512" height="512"></canvas>
    <script>
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        
        function createIcon(size, text) {
            canvas.width = size;
            canvas.height = size;
            
            const gradient = ctx.createLinearGradient(0, 0, size, size);
            gradient.addColorStop(0, '#ff6b35');
            gradient.addColorStop(1, '#f7931e');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, size, size);
            
            ctx.globalCompositeOperation = 'destination-in';
            ctx.beginPath();
            ctx.roundRect(0, 0, size, size, size * 0.1);
            ctx.fill();
            ctx.globalCompositeOperation = 'source-over';
            
            ctx.fillStyle = 'white';
            ctx.font = \`bold \${size * 0.3}px Arial, sans-serif\`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, size / 2, size / 2);
            
            return canvas.toDataURL('image/png');
        }
        
        function createGameImage() {
            canvas.width = 400;
            canvas.height = 600;
            
            const gradient = ctx.createLinearGradient(0, 0, 400, 600);
            gradient.addColorStop(0, '#1a1a2e');
            gradient.addColorStop(1, '#16213e');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 400, 600);
            
            ctx.fillStyle = '#ff6b35';
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('GAME', 200, 250);
            
            ctx.fillStyle = '#ffd23f';
            ctx.font = '24px Arial';
            ctx.fillText('Coming Soon', 200, 300);
            
            for (let i = 0; i < 20; i++) {
                ctx.fillStyle = \`rgba(255, 210, 63, \${Math.random() * 0.5})\`;
                ctx.beginPath();
                ctx.arc(Math.random() * 400, Math.random() * 600, Math.random() * 10, 0, Math.PI * 2);
                ctx.fill();
            }
            
            return canvas.toDataURL('image/jpeg', 0.8);
        }
        
        console.log('Generated images - copy these data URLs to create actual image files:');
        console.log('Icon 192:', createIcon(192, 'GB'));
        console.log('Icon 512:', createIcon(512, 'GB'));
        console.log('Default Game:', createGameImage());
    </script>
</body>
</html>
`;

fs.writeFileSync(path.join(__dirname, 'image-generator.html'), imageGeneratorHTML);

console.log('Image generation script created!');
console.log('1. Open scripts/image-generator.html in a browser');
console.log('2. Check browser console for data URLs');
console.log('3. Convert data URLs to actual image files');
console.log('4. Place images in public/images/ directory');

const imageRequirements = `
# Required Images for GameBlast Mobile

## Critical Images (Required for deployment):
1. favicon.ico (32x32) - Browser favicon
2. icon-192.png (192x192) - PWA icon
3. icon-512.png (512x512) - PWA icon
4. apple-touch-icon.png (180x180) - iOS icon

## Recommended Images:
5. default-game.jpg (400x600) - Default game banner
6. hero-bg.jpg (1920x1080) - Hero background
7. logo.png (various sizes) - Platform logo

## How to create:
1. Use the image-generator.html script
2. Or use online tools like:
   - Canva.com for banners and graphics
   - Favicon.io for favicons
   - Placeholder.com for temporary images

## Temporary Solution:
For immediate deployment, you can use:
- favicon.svg (created by script)
- Placeholder images from placeholder.com
- Default browser icons

The platform will work without these images, but they improve user experience.
`;

fs.writeFileSync(path.join(imagesDir, 'README.md'), imageRequirements);

console.log('Image requirements documented in public/images/README.md');