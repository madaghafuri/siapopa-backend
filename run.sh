#!/bin/bash
set -e

echo "Creating Volume"
npm run db:migrate:prod & PID=$!
# Wait for migration to finish
wait $PID

echo "Starting production server..."
node /app/dist/index.js

wait $PID