#!/bin/sh
# Run on NAS manually to force-recreate the container.
# Usage: sh recreate-container.sh [image-tag]
set -e

IMAGE="ghcr.io/fralopgom/culinaryhub:${1:-latest}"
CONTAINER="culinaryhub"
ENV_FILE="/share/CACHEDEV1_DATA/culinaryhub/app.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE not found. Create it before running this script."
  exit 1
fi

docker pull "$IMAGE"
docker stop "$CONTAINER" 2>/dev/null || true
docker rm   "$CONTAINER" 2>/dev/null || true
docker run -d \
  --name "$CONTAINER" \
  --restart unless-stopped \
  --env-file "$ENV_FILE" \
  -p 3001:3000 \
  "$IMAGE"

sleep 3
curl -sf http://localhost:3001 && echo "OK" || (docker logs "$CONTAINER" --tail 30 && exit 1)
