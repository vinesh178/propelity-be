#!/bin/bash

set -e

# Check if .env file exists
if [ ! -f .env ]; then
  echo "Error: .env file not found. Please create one based on .env.example"
  exit 1
fi

echo "Building Docker image..."
# Build the Docker image using docker-compose
if ! docker-compose build app; then
  echo "Error: Failed to build Docker image"
  exit 1
fi

# Show the built image
echo "\nDocker image built successfully:"
if ! docker images | grep admin-dashboard; then
  echo "Warning: Could not find admin-dashboard image in docker images"
  exit 1
fi