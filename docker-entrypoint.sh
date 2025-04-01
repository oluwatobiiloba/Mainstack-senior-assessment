#!/bin/sh
set -e

# Start MongoDB in the background
mongod --bind_ip 0.0.0.0 &

# Wait for MongoDB to be ready
until mongosh --quiet --eval "db.runCommand({ping: 1})" > /dev/null 2>&1; do
    echo "Waiting for MongoDB to start..."
    sleep 2
done

echo "MongoDB is ready. Starting Node.js application..."

# Start the Node.js application
exec node dist/server.js