#!/bin/bash

# Build the Docker image
docker build -t admin-dashboard .

# Show the built image
echo "\nDocker image built successfully:"
docker images | grep admin-dashboard