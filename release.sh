#!/bin/bash

# GNOME Shell Extension Release Script
# Creates a zip file ready for distribution/upload to extensions.gnome.org

set -e

EXTENSION_NAME="pingbot@gudlenieks.lv"
OUTPUT_FILE="${EXTENSION_NAME}.zip"

echo "🤖 Ping Bot Release Script"
echo "=========================="

# Remove old zip if exists
if [ -f "$OUTPUT_FILE" ]; then
    echo "Removing old $OUTPUT_FILE"
    rm "$OUTPUT_FILE"
fi

echo "Creating release zip..."

# Create zip with all files except excluded ones
zip -r "$OUTPUT_FILE" . \
    -x "*.git*" \
    -x "release.sh" \
    -x "schemas/gschemas.compiled" \
    -x "git-images/*" \
    -x "*.zip" \
    -x ".idea/*" \
    -x ".claude/*" \
    -x "AGENTS.md"

echo "✅ Release created: $OUTPUT_FILE"
echo ""
echo "Contents:"
unzip -l "$OUTPUT_FILE"
echo ""
echo "📦 Ready for distribution!"
