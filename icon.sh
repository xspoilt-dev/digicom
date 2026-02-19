#!/usr/bin/bash

SRC=$1

cd public || exit

convert -resize 512x512 "$SRC" icon.png
convert -resize 144x144 "$SRC" icon144.png
convert -resize 192x192 "$SRC" icon192.png
convert -resize 256x256 "$SRC" logo.png
mv "$SRC" base.png
