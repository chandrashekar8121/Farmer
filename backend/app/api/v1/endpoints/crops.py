from fastapi import APIRouter
from app.services.fertilizer_service import CROP_RDF
from app.services.ml_service import CROP_DISPLAY_INFO

router = APIRouter()


@router.get("/crops")
def list_crops():
    """Returns catalog of supported crops with regional names and agronomic standards."""
    crops_list = []
    for key, info in CROP_DISPLAY_INFO.items():
        rdf = CROP_RDF.get(key, {"N": 100.0, "P": 50.0, "K": 50.0})
        crops_list.append({
            "id": key,
            "name": info["name"],
            "english_name": key.capitalize(),
            "season": info.get("season", "Kharif/Rabi"),
            "advisory": info.get("advisory", ""),
            "baseline_rdf": {
                "n_kg_ha": rdf["N"],
                "p_kg_ha": rdf["P"],
                "k_kg_ha": rdf["K"]
            }
        })
    return {"crops": crops_list, "total": len(crops_list)}
