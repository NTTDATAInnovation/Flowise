#!/usr/bin/env sh

set -euo pipefail

# short sha
SHA=$(git rev-parse --short HEAD)
IMAGE="flowise-custom:$SHA"

docker build -t "$IMAGE" .
# docker run --name flowise --rm "$IMAGE"

ibmcloud cr login
docker tag "$IMAGE" "de.icr.io/ns-watsonx-poc/flowise-custom:$SHA"
docker tag "$IMAGE" "de.icr.io/ns-watsonx-poc/flowise-custom:latest"
docker push "de.icr.io/ns-watsonx-poc/flowise-custom:$SHA"
docker push "de.icr.io/ns-watsonx-poc/flowise-custom:latest"
