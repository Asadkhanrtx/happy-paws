import os
import traceback
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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

# These headers must never be forwarded — they are connection-scoped, not end-to-end
_HOP_BY_HOP = {
    "host", "content-length", "transfer-encoding", "connection",
    "keep-alive", "proxy-authenticate", "proxy-authorization",
    "te", "trailers", "upgrade", "accept-encoding",
}

@app.get("/")
@app.get("/health")
def health():
    return {"status": "healthy", "service": "API Gateway"}

@app.api_route("/api/{service}/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def route_with_prefix(service: str, path: str, request: Request):
    return await _proxy(service, path, request)

@app.api_route("/{service}/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def route_request(service: str, path: str, request: Request):
    return await _proxy(service, path, request)

async def _proxy(service: str, path: str, request: Request):
    if service not in SERVICES:
        return JSONResponse({"error": f"Service '{service}' not found"}, status_code=404)

    url = f"{SERVICES[service]}/{path}"
    if request.url.query:
        url = f"{url}?{request.url.query}"

    body = await request.body()
    headers = {
        k: v for k, v in request.headers.items()
        if k.lower() not in _HOP_BY_HOP
    }

    print(f"[gateway] {request.method} {url}  body_len={len(body)}")

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            upstream = await client.request(
                method=request.method,
                url=url,
                headers=headers,
                content=body,
            )
        print(f"[gateway] upstream returned {upstream.status_code}")
        return Response(
            content=upstream.content,
            status_code=upstream.status_code,
            media_type=upstream.headers.get("content-type", "application/json"),
        )
    except Exception as exc:
        print(f"[gateway] PROXY ERROR  {request.method} {url}  →  {exc}")
        traceback.print_exc()
        return JSONResponse(
            {"error": "Gateway proxy error", "detail": str(exc)},
            status_code=502,
        )

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
