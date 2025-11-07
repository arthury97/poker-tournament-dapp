#!/bin/bash

echo "🚀 Installing Solana Development Tools..."
echo ""

# Install Rust
echo "📦 Installing Rust..."
if ! command -v rustc &> /dev/null; then
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
    echo "✅ Rust installed"
else
    echo "✅ Rust already installed"
fi

# Install Solana CLI
echo ""
echo "⚡ Installing Solana CLI..."
if ! command -v solana &> /dev/null; then
    sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
    export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
    echo "✅ Solana CLI installed"
else
    echo "✅ Solana CLI already installed"
fi

# Install Anchor
echo ""
echo "⚓ Installing Anchor Framework..."
if ! command -v anchor &> /dev/null; then
    cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
    avm install latest
    avm use latest
    echo "✅ Anchor installed"
else
    echo "✅ Anchor already installed"
fi

# Verify installations
echo ""
echo "🔍 Verifying installations..."
echo ""
echo "Rust version:"
rustc --version
echo ""
echo "Cargo version:"
cargo --version
echo ""
echo "Solana version:"
solana --version
echo ""
echo "Anchor version:"
anchor --version

echo ""
echo "✨ All tools installed successfully!"
echo ""
echo "Next steps:"
echo "1. Run: source ~/.cargo/env"
echo "2. Run: export PATH=\"\$HOME/.local/share/solana/install/active_release/bin:\$PATH\""
echo "3. Configure Solana: solana config set --url devnet"
echo "4. Create wallet: solana-keygen new"
