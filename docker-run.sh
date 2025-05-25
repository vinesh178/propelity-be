#!/bin/bash

set -e

# Check if .env file exists
if [ ! -f .env ]; then
  echo "Error: .env file not found. Please create one based on .env.example"
  exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
  echo "Error: docker-compose is not installed"
  exit 1
fi

# Stop any existing containers managed by docker-compose
echo "Stopping any existing containers..."
if ! docker-compose down; then
  echo "Warning: Failed to stop existing containers, continuing anyway..."
fi

# Check if port 3000 is in use by any container not managed by docker-compose
PORT_CONTAINER=$(docker ps -q --filter "publish=3000")
if [ -n "$PORT_CONTAINER" ]; then
  echo "Port 3000 is already in use by another container. Stopping it..."
  if ! docker stop $PORT_CONTAINER || ! docker rm $PORT_CONTAINER; then
    echo "Error: Failed to stop and remove container using port 3000"
    exit 1
  fi
  echo "Container using port 3000 stopped and removed."
fi

# Start the containers using docker-compose
echo "Starting containers with docker-compose..."
if ! docker-compose up -d; then
  echo "Error: Failed to start containers"
  exit 1
fi

# Wait for the container to be healthy
echo "Waiting for container to be healthy..."
sleep 5

# Check if container is running
if ! docker-compose ps | grep -q "Up"; then
  echo "Error: Container failed to start properly"
  docker-compose logs
  exit 1
fi

echo "\nContainers started successfully. The application is available at http://localhost:3000"
echo "To view logs: docker-compose logs -f app"