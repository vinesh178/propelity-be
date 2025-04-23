#!/bin/bash

# Check if .env file exists
if [ ! -f .env ]; then
  echo "Error: .env file not found. Please create one based on .env.example"
  exit 1
fi

# Run the Docker container
docker run -p 3000:3000 --env-file .env -d admin-dashboard

echo "\nContainer started. The application is available at http://localhost:3000"
echo "To view logs: docker logs <container_id>"