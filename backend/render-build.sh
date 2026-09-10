#!/usr/bin/env bash
# Render build script for WorkPilot AI Backend

set -o errexit  # Exit on error

# Upgrade pip to latest version
pip install --upgrade pip

# Install dependencies using only binary wheels (no compilation)
pip install --only-binary=:all: -r requirements.txt
