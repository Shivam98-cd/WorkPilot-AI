#!/usr/bin/env bash
# Render build script for WorkPilot AI Backend

set -o errexit  # Exit on error

echo "🔧 Starting build process..."
echo "📦 Python version:"
python --version

echo "📦 Upgrading pip..."
pip install --upgrade pip

echo "📦 Installing dependencies..."
pip install -r requirements.txt

echo "✅ Build complete!"
