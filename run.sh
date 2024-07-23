#!/bin/bash
set -e

echo "Creating Volume..."
bun run db:migrate & PID=$!
# Wait for migration to finish
wait

# dev
# echo "Rebuilding CSS..."
# bun run build:css & PID=$!
# wait $PID

echo "Starting production server..."
bun run /app/src/index.ts

wait