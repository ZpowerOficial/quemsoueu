#!/bin/bash
# Generate placeholder icons using ImageMagick

SIZES=(72 96 128 144 152 192 384 512)
COLOR="#1976d2"

for SIZE in "${SIZES[@]}"; do
  convert -size ${SIZE}x${SIZE} xc:"$COLOR" \
    -gravity center \
    -pointsize $((SIZE/3)) \
    -fill white \
    -annotate +0+0 "⚽" \
    "icon-${SIZE}x${SIZE}.png"
done

echo "Icons generated!"
