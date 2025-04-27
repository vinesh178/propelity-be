#!/bin/bash

# Check if .env file exists
if [ ! -f .env ]; then
  echo "Error: .env file not found. Please create one based on .env.example"
  exit 1
fi

# Check if container is already running and stop it
CONTAINER_ID=$(docker ps -q --filter "name=admin-dashboard")
if [ -n "$CONTAINER_ID" ]; then
  echo "Stopping existing admin-dashboard container..."
  docker stop $CONTAINER_ID
  echo "Container stopped."
fi

# Run the Docker container
echo "Starting admin-dashboard container..."
docker run -p 3000:3000 --env-file .env -d --name admin-dashboard admin-dashboard

echo "\nContainer started. The application is available at http://localhost:3000"
echo "To view logs: docker logs admin-dashboard"