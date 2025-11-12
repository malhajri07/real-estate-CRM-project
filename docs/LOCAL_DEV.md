# Local Development Workflow

This project can run in two modes during development:

## Unified Development Server (Recommended)

The unified server runs both the API and frontend on a single port (3000):

```bash
npm run dev
# or explicitly:
npm run dev:unified
```

This uses Vite middleware to serve the frontend while proxying API requests to the Express backend, all on port 3000.

**Verification:**
- Web client & API: `http://localhost:3000`
- API health check: `curl http://localhost:3000/health`
- API endpoints: `http://localhost:3000/api/*`

## Separate Servers (Legacy)

For development with separate processes:

- **API (port 3001 by default)**  
  ```bash
  npm run dev:server
  ```

- **Web client / Vite dev server (port 3000 by default)**  
  ```bash
  npm run dev:client
  ```

- **Both servers in parallel**  
  ```bash
  npm run dev:all
  ```

**Verification:**
- API health check: `curl http://localhost:3001/health`
- Web client: open `http://localhost:3000` in your browser

## Stopping Servers

Press `Ctrl+C` to stop the process. If running separate servers, stop both processes when switching branches to avoid stale code or port conflicts.

