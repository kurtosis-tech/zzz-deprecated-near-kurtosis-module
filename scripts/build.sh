#!/usr/bin/env bash
set -euo pipefail # Bash "strict mode"
script_dirpath="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
root_dirpath="$(dirname "${script_dirpath}")"

# ==================================================================================================
#                                             Constants
# ==================================================================================================
IMAGE_ORG_AND_REPO="kurtosistech/near-kurtosis-lambda"
LAMBDA_DIRNAME="kurtosis-lambda"

GET_DOCKER_TAG_SCRIPT_FILENAME="get-docker-image-tag.sh"

# =============================================================================
#                                 Main Code
# =============================================================================
# Checks if dockerignore file is in the root path
if ! [ -f "${root_dirpath}"/.dockerignore ]; then
  echo "Error: No .dockerignore file found in language root '${root_dirpath}'; this is required so Docker caching is enabled and your Kurtosis Lambda builds remain quick" >&2
  exit 1
fi

get_docker_image_tag_script_filepath="${script_dirpath}/${GET_DOCKER_TAG_SCRIPT_FILENAME}"
if ! docker_tag="$(bash "${get_docker_image_tag_script_filepath}")"; then
    echo "Error: Couldn't get the Docker image tag" >&2
    exit 1
fi

# Build Docker image
dockerfile_filepath="${root_dirpath}/${LAMBDA_DIRNAME}/Dockerfile"
image_name="${IMAGE_ORG_AND_REPO}:${docker_tag}"
echo "Building Kurtosis Lambda into a Docker image named '${image_name}'..."
if ! docker build -t "${image_name}" -f "${dockerfile_filepath}" "${root_dirpath}"; then
  echo "Error: Docker build of the Kurtosis Lambda failed" >&2
  exit 1
fi
echo "Successfully built Docker image '${image_name}' containing the Kurtosis Lambda"
