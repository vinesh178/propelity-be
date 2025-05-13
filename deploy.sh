#!/bin/bash

set -e

# Check if .env file exists
if [ ! -f .env ]; then
  echo "Error: .env file not found. Please create one based on .env.example"
  exit 1
fi

# Stop any existing containers
echo "Stopping any existing containers..."
docker-compose down

# Build the new image
echo "Building Docker image..."
docker-compose build app

# Start the containers
echo "Starting containers..."
docker-compose up -d

RESULT=$?
if [ $RESULT -eq 0 ]; then
  echo "\nDeployment successful. The application is available at http://localhost:3000"
  echo "To view logs: docker-compose logs -f app"
  
  # Run email test if specified
  if [ "$1" = "--test-email" ]; then
    echo "\nRunning email test..."
    docker-compose exec app node src/docker-test-email.js
  fi
else
  echo "\nDeployment failed. Please check for errors above."
  exit $RESULT
fi 