from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import api_router
from app.database.session import engine, Base, SessionLocal
from app.database import models
from app.services.fertilizer_service import FERTILIZER_CATALOG

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Krishi Saathi Backend API - Smart Fertilizer & Crop Management for Elderly Farmers",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration for deployed and local frontend origins
origins = settings.cors_origin_list
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_init_db():
    """Initializes tables and populates fertilizer catalog if missing."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Check if fertilizer products exist
        count = db.query(models.FertilizerProduct).count()
        if count == 0:
            for key, spec in FERTILIZER_CATALOG.items():
                p = models.FertilizerProduct(
                    product_name=spec["name"],
                    generic_name=spec["generic"],
                    n_percent=spec["n_pct"] * 100,
                    p_percent=spec["p_pct"] * 100,
                    k_percent=spec["k_pct"] * 100,
                    bag_size_kg=spec["bag_size_kg"],
                    standard_price_inr=spec["price_per_bag"],
                    is_subsidized=True
                )
                db.add(p)
            db.commit()
    except Exception as e:
        print(f"Startup DB init warning: {e}")
    finally:
        db.close()


# Mount API V1 routes
app.include_router(api_router, prefix=settings.API_V1_STR)


# Direct health endpoint at root /health for Render health checks
@app.get("/health", tags=["Health"])
def root_health():
    return {
        "status": "online",
        "service": "Krishi Saathi API",
        "version": settings.VERSION
    }


@app.get("/", tags=["Root"])
def root_info():
    return {
        "message": "Welcome to Krishi Saathi API",
        "docs": "/docs",
        "health": "/health"
    }
