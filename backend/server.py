"""
HomeFinder - application entry-point.

Architecture:
   controllers/  ->  services/  ->  repositories/
                     (business)     (data access)

Singleton:
   core/session_manager.py holds the global SessionManager() instance used to
   track the currentUser across requests, as required by the SIS.
"""

from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import logging
import sys

# Make sibling packages importable when uvicorn launches from /app/backend
sys.path.insert(0, str(ROOT_DIR))

from fastapi import FastAPI, APIRouter
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient

from repositories.user_repository import UserRepository
from repositories.property_repository import PropertyRepository
from services.auth_service import AuthService
from services.property_service import PropertyService
from controllers.auth_controller import router as auth_router
from controllers.property_controller import router as property_router
from seed import seed_admin, seed_properties


# ---- logging ----------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("homefinder")


# ---- Mongo --------------------------------------------------------------------
mongo_client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = mongo_client[os.environ["DB_NAME"]]


# ---- FastAPI app -------------------------------------------------------------
app = FastAPI(title="HomeFinder API", version="1.0")

# Wire layers (controller -> service -> repository).
user_repo = UserRepository(db)
property_repo = PropertyRepository(db)
auth_service = AuthService(db, user_repo)
property_service = PropertyService(property_repo)

# Stash on app.state so route handlers can pull them via Depends.
app.state.user_repo = user_repo
app.state.property_repo = property_repo
app.state.auth_service = auth_service
app.state.property_service = property_service


# Single /api router holds both sub-routers - keeps the K8s ingress happy.
api_router = APIRouter(prefix="/api")
api_router.include_router(auth_router)
api_router.include_router(property_router)


@api_router.get("/")
async def root():
    return {"app": "HomeFinder", "status": "ok"}


app.include_router(api_router)


# ---- CORS --------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---- startup/shutdown --------------------------------------------------------
@app.on_event("startup")
async def on_startup():
    await user_repo.ensure_indexes()
    await property_repo.ensure_indexes()
    await auth_service.ensure_indexes()
    await seed_admin(user_repo)
    await seed_properties(property_repo)
    logger.info("HomeFinder ready. Admin: %s", os.environ["ADMIN_EMAIL"])


@app.on_event("shutdown")
async def on_shutdown():
    mongo_client.close()
