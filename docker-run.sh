#!/bin/bash

set -e

# Check if .env file exists
if [ ! -f .env ]; then
  echo "Error: .env file not found. Please create one based on .env.example"
  exit 1
fi

# Stop any existing containers managed by docker-compose
echo "Stopping any existing containers..."
docker-compose down

# Check if port 3000 is in use by any container not managed by docker-compose
PORT_CONTAINER=$(docker ps -q --filter "publish=3000")
if [ -n "$PORT_CONTAINER" ]; then
  echo "Port 3000 is already in use by another container. Stopping it..."
  docker stop $PORT_CONTAINER
  docker rm $PORT_CONTAINER
  echo "Container using port 3000 stopped and removed."
fi

# Start the containers using docker-compose
echo "Starting containers with docker-compose..."
docker-compose up -d

RESULT=$?
if [ $RESULT -eq 0 ]; then
  echo "\nContainers started successfully. The application is available at http://localhost:3000"
  echo "To view logs: docker-compose logs -f app"
else
  echo "\nFailed to start containers. Please check for errors above."
  exit $RESULT
fi