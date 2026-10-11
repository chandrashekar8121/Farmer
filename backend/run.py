import os
import sys
import uvicorn

if __name__ == "__main__":
    port_str = os.environ.get("PORT", "10000")
    try:
        port = int(port_str)
    except ValueError:
        port = 10000

    print(f"Starting Krishi Saathi API on 0.0.0.0:{port}...")
    try:
        uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)
    except Exception as exc:
        print(f"Fatal error starting server: {exc}", file=sys.stderr)
        raise
