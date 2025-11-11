# Local Development Workflow

This project runs the API and the web client as two separate processes during
development. Use the following scripts from the repository root:

## Start Servers

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

Each script streams logs to the terminal; press `Ctrl+C` to stop the process.

## Verification

- API health check: `curl http://localhost:3001/health`
- Web client: open `http://localhost:3000` in your browser

If you restart one server, the other continues to run. When switching branches,
stop both processes to avoid stale code or port conflicts.

