#!/bin/bash

set -e

# Display help information
function show_help {
  echo "Usage: ./deploy.sh [OPTIONS]"
  echo ""
  echo "Options:"
  echo "  --help          Show this help message"
  echo "  --test-email    Run email test after deployment"
  echo "  --network-test  Run network connectivity tests"
  echo "  --host-network  Use host network mode instead of bridge network"
  echo ""
  echo "Example: ./deploy.sh --test-email"
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

# Process options
USE_HOST_NETWORK=false
RUN_EMAIL_TEST=false
RUN_NETWORK_TEST=false

for arg in "$@"; do
  case $arg in
    --host-network)
      USE_HOST_NETWORK=true
      ;;
    --test-email)
      RUN_EMAIL_TEST=true
      ;;
    --network-test)
      RUN_NETWORK_TEST=true
      ;;
  esac
done

# Modify docker-compose.yml if using host network
if [ "$USE_HOST_NETWORK" = true ]; then
  echo "Using host network mode..."
  # Create a temporary file with host network mode enabled
  sed 's/# network_mode: host/network_mode: host/' docker-compose.yml > docker-compose.host.yml
  sed -i 's/networks:/# networks:/' docker-compose.host.yml
  sed -i 's/  app-network:/  # app-network:/' docker-compose.host.yml
  sed -i 's/    # Use explicit IPv4/    # # Use explicit IPv4/' docker-compose.host.yml
  sed -i 's/    ipv4_address:/    # ipv4_address:/' docker-compose.host.yml
  COMPOSE_FILE="-f docker-compose.host.yml"
else
  COMPOSE_FILE=""
fi

# Stop any existing containers
echo "Stopping any existing containers..."
docker-compose $COMPOSE_FILE down

# Build the new image
echo "Building Docker image..."
docker-compose $COMPOSE_FILE build app

# Start the containers
echo "Starting containers..."
docker-compose $COMPOSE_FILE up -d

RESULT=$?
if [ $RESULT -eq 0 ]; then
  echo "\nDeployment successful. The application is available at http://localhost:3000"
  echo "To view logs: docker-compose logs -f app"
  
  # If requested, run network tests
  if [ "$RUN_NETWORK_TEST" = true ]; then
    echo "\nRunning network connectivity tests..."
    docker-compose $COMPOSE_FILE exec app node src/network-test.js
  fi
  
  # If requested, run email test
  if [ "$RUN_EMAIL_TEST" = true ]; then
    echo "\nRunning email test..."
    docker-compose $COMPOSE_FILE exec app node src/docker-test-email.js
  fi
else
  echo "\nDeployment failed. Please check for errors above."
  exit $RESULT
fi

# Clean up temporary files
if [ -f docker-compose.host.yml ]; then
  rm docker-compose.host.yml
fi 