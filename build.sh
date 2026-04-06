#!/bin/bash
set -e  # Exit immediately if any command fails

echo "Building project with Vite..."
npx vite build

# Check if the built HTML file exists
if [ -f "./dist/index.html" ]; then
    echo "Moving ./dist/index.html to ./xchomp.html"
    mv ./dist/index.html ./xchomp.html
else
    echo "Error: ./dist/index.html not found after build"
    exit 1
fi

echo "Removing ./dist directory..."
rm -rf ./dist

echo "Done! Result: xchomp.html"
