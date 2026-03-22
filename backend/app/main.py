from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import translate, convert, history

app = FastAPI(
    title="Sistem Traduceri API",
    description="Backend API for math document translation",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(translate.router, prefix="/api")
app.include_router(convert.router, prefix="/api")
app.include_router(history.router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "Sistem Traduceri API"}
