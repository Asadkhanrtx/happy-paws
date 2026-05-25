import os
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
import httpx
import uvicorn

app = FastAPI(title="API Gateway")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SERVICES = {
    "users":         os.environ.get("USER_SERVICE_URL",         "http://localhost:8001"),
    "pets":          os.environ.get("PET_SERVICE_URL",          "http://localhost:8002"),
    "appointments":  os.environ.get("APPOINTMENT_SERVICE_URL",  "http://localhost:8003"),
    "orders":        os.environ.get("ORDER_SERVICE_URL",        "http://localhost:8004"),
    "notifications": os.environ.get("NOTIFICATION_SERVICE_URL", "http://localhost:8005"),
}

@app.get("/")
@app.get("/health")
def health():
    return {"status": "healthy", "service": "API Gateway"}

# Handles both /api/{service}/... (via ALB path routing) and /{service}/... (direct)
@app.api_route("/api/{service}/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def route_with_prefix(service: str, path: str, request: Request):
    return await _proxy(service, path, request)

@app.api_route("/{service}/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def route_request(service: str, path: str, request: Request):
    return await _proxy(service, path, request)

async def _proxy(service: str, path: str, request: Request):
    if service not in SERVICES:
        return {"error": f"Service '{service}' not found"}

    url = f"{SERVICES[service]}/{path}"
    body = await request.body()

    # Forward relevant headers, strip host to avoid conflicts
    headers = {
        k: v for k, v in request.headers.items()
        if k.lower() not in ("host", "content-length")
    }

    # Append query string if present
    if request.url.query:
        url = f"{url}?{request.url.query}"

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.request(
            method=request.method,
            url=url,
            headers=headers,
            content=body,
        )

    return Response(
        content=response.content,
        status_code=response.status_code,
        media_type=response.headers.get("content-type", "application/json"),
    )

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
