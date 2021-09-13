#!/usr/bin/env bash
set -euo pipefail # Bash "strict mode"
script_dirpath="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
root_dirpath="$(dirname "${script_dirpath}")"

# ==================================================================================================
#                                             Constants
# ==================================================================================================
IMAGE_NAME="near-lambda"
LAMBDA_DIRNAME="kurtosis-lambda"

# =============================================================================
#                                 Main Code
# =============================================================================
# Checks if dockerignore file is in the root path
if ! [ -f "${root_dirpath}"/.dockerignore ]; then
  echo "Error: No .dockerignore file found in language root '${root_dirpath}'; this is required so Docker caching is enabled and your Kurtosis Lambda builds remain quick" >&2
  exit 1
fi

# Build Docker image
dockerfile_filepath="${root_dirpath}/${LAMBDA_DIRNAME}/Dockerfile"
echo "Building Kurtosis Lambda into a Docker image named '${IMAGE_NAME}'..."
if ! docker build -t "${IMAGE_NAME}" -f "${dockerfile_filepath}" "${root_dirpath}"; then
  echo "Error: Docker build of the Kurtosis Lambda failed" >&2
  exit 1
fi
echo "Successfully built Docker image '${IMAGE_NAME}' containing the Kurtosis Lambda"
