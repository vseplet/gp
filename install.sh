#!/bin/bash
set -e

echo "Installing Git Profile Manager (gp)..."
echo

# Check if Deno is installed
if ! command -v deno &> /dev/null; then
    echo "Deno not found. Installing..."
    curl -fsSL https://deno.land/install.sh | sh

    # Add to PATH for current session
    export DENO_INSTALL="$HOME/.deno"
    export PATH="$DENO_INSTALL/bin:$PATH"

    echo
    echo "Deno installed. You may need to restart your shell or run:"
    echo "  export PATH=\"\$HOME/.deno/bin:\$PATH\""
    echo
fi

echo "Deno version: $(deno --version | head -1)"
echo

# Install gp
echo "Installing gp..."
deno install -g -n gp -rf --allow-read --allow-write --allow-run --allow-env \
    --import-map=https://cdn.jsdelivr.net/gh/vseplet/gp@main/import_map.json \
    https://cdn.jsdelivr.net/gh/vseplet/gp@main/mod.ts

echo
echo "Done! Run 'gp --help' to get started."
echo
echo "If 'gp' command is not found, add Deno to your PATH:"
echo "  export PATH=\"\$HOME/.deno/bin:\$PATH\""
