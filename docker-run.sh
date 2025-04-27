#!/bin/bash

set -e

# Check if .env file exists
if [ ! -f .env ]; then
  echo "Error: .env file not found. Please create one based on .env.example"
  exit 1
fi

# Function to check if a container exists
container_exists() {
  docker ps -a --format '{{.Names}}' | grep -q "^$1$"
  return $?
}

# Check if port 3000 is in use by any container and stop it
PORT_CONTAINER=$(docker ps -q --filter "publish=3000")
if [ -n "$PORT_CONTAINER" ]; then
  echo "Stopping container using port 3000..."
  docker stop $PORT_CONTAINER
  docker rm $PORT_CONTAINER
  echo "Container using port 3000 stopped and removed."
fi

# Check specifically for our named container and force remove it if it exists
if container_exists "admin-dashboard"; then
  echo "Removing existing admin-dashboard container..."
  docker stop admin-dashboard 2>/dev/null || true
  docker rm -f admin-dashboard 2>/dev/null || true
  
  # Double-check if container was removed
  if container_exists "admin-dashboard"; then
    echo "Failed to remove container. Trying with force option..."
    docker rm -f admin-dashboard
  fi
  
  echo "Container removed."
fi

# Run the Docker container
echo "Starting admin-dashboard container..."
docker run -p 3000:3000 --env-file .env -d --name admin-dashboard admin-dashboard

RESULT=$?
if [ $RESULT -eq 0 ]; then
  echo "\nContainer started successfully. The application is available at http://localhost:3000"
  echo "To view logs: docker logs admin-dashboard"
else
  echo "\nFailed to start container. Please check for errors above."
  exit $RESULT
fi