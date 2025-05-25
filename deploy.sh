#!/bin/bash

set -e

# Display help information
function show_help {
  echo "Usage: ./deploy.sh"
  echo ""
  echo "This script deploys the application using docker-compose"
}

# Check for help flag
if [[ "$1" == "--help" ]]; then
  show_help
  exit 0
fi

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
else
  echo "\nDeployment failed. Please check for errors above."
  exit $RESULT
fi 