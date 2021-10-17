FROM node:14.17.6-alpine3.14 AS builder

WORKDIR /build

COPY package.json .
COPY yarn.lock .

RUN yarn install

# Copy the code into the container
COPY . .

# Copy local static files inside the Kurtosis module image
COPY kurtosis-module/static_files /static-files

RUN yarn build

# Build the application
CMD node build/main.js

# TODO TODO TODO TODO copy to an execution image!!!!
# 
# # ============= Execution Stage ================
# FROM node:14.17-alpine AS execution
# 
# WORKDIR /run
# 
# ENV NODE_ENV production
# 
# # Copy the code into the container
# COPY --from=builder /build/build
# 
# # Copy local static files inside the testsuite image
# COPY testsuite/static_files /static-files
# 
# CMD ./testsuite.bin
