#!/bin/bash

# Start Docker Compose services
docker-compose up -d

# Wait for MySQL to be ready
until docker-compose exec mysql mysqladmin ping -h localhost --silent; do
    sleep 1
done

# Start React development server
cd frontend
npm install
npm start
