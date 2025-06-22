#!/bin/sh

# Detect if we're running inside Docker
if [ -f /.dockerenv ] || [ -n "$DOCKER_CONTAINER" ]; then
    # Inside Docker - use environment variables directly
    exec "$@"
else
    # Outside Docker - use .env.local
    exec dotenv -e .env.local -- "$@"
fi 