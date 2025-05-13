#!/bin/bash

# Build the Docker image using docker-compose
docker-compose build app

# Show the built image
echo "\nDocker image built successfully:"
docker images | grep admin-dashboard