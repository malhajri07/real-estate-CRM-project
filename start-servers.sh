#!/bin/bash

echo "Starting unified dev server (API + React) on port 5001..."

# The Express server bootstraps Vite in middleware mode, so a single
# process now serves both the backend API and the front-end with HMR.
PORT=5001 NODE_ENV=development npm run dev:server
