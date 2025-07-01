#!/bin/bash

DOCKERFILE="Dockerfile"

docker build -t vite_ui -f "$DOCKERFILE" .

docker run -it --rm \
    --name vite_webxr_ui \
    --net host \
    --ipc host \
    --privileged \
    vite_ui
