#!/bin/bash
if [ $# -eq 0 ]; then
        echo "No image version found"
        echo "Usage: " $0 " {image version}"
        echo "example: " $0 " 1.0"
        exit 1
else
    echo "At password prompt enter: dckr_pat_uAsv62pML__AhK_OXBqwwkLUwJU"
    docker login -u ee5610110106
    DOCKER_BUILDKIT=1 docker build --platform linux/amd64 -t ee5610110106/crok:$1 .
    docker push ee5610110106/crok:$1
fi