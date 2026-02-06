// Simple script to generate placeholder PNGs using canvas (if needed)
const fs = require('fs');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

sizes.forEach(size => {
  // For now, just copy the SVG - browsers will handle it
  // In production, you would use a proper tool to convert SVG to PNG
  console.log(`Would generate icon-${size}x${size}.png`);
});
