"""
Krishi Saathi - Soil Test Report Text Extraction & OCR Service
Supports: Digital PDFs (via pypdf), Text reports, and Image OCR fallback.
Extracts: Nitrogen, Phosphorus, Potassium, Soil pH, Organic Carbon, EC.
"""

import io
import re
from typing import Dict, Any, Tuple
from pypdf import PdfReader


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extracts text content from PDF pages."""
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
        return text
    except Exception as e:
        print(f"PDF extraction error: {e}")
        return ""


def extract_soil_values_from_text(raw_text: str) -> Dict[str, Any]:
    """
    Parses extracted text using regex patterns commonly found in
    Indian Soil Health Cards and agricultural diagnostic laboratory reports.
    """
    text = raw_text.replace(",", "")
    result = {
        "nitrogen_mg_kg": None,
        "phosphorus_mg_kg": None,
        "potassium_mg_kg": None,
        "soil_ph": None,
        "organic_carbon_percent": None,
        "electrical_conductivity_ds_m": None,
        "lab_name": None,
        "detected_units": "mg/kg"
    }

    # 1. Soil pH pattern (e.g., "pH : 7.2", "Soil pH: 6.8", "pH value 7.5")
    ph_match = re.search(r"(?:soil\s*)?ph(?:\s*value)?[\s:=]+([0-9]+(?:\.[0-9]+)?)", text, re.IGNORECASE)
    if ph_match:
        try:
            val = float(ph_match.group(1))
            if 0.0 <= val <= 14.0:
                result["soil_ph"] = val
        except ValueError:
            pass

    # 2. Nitrogen pattern (e.g., "Nitrogen: 120 mg/kg", "Available N : 240 kg/ha", "N : 110 ppm")
    n_match = re.search(
        r"(?:available\s*)?(?:nitrogen|n)[\s:=]+([0-9]+(?:\.[0-9]+)?)\s*(mg/kg|ppm|kg/ha)?",
        text,
        re.IGNORECASE
    )
    if n_match:
        try:
            val = float(n_match.group(1))
            unit = (n_match.group(2) or "mg/kg").lower()
            if unit == "kg/ha":
                # Convert kg/ha to mg/kg (standard approx factor: mg/kg = kg/ha / 2.24)
                val = round(val / 2.24, 2)
            result["nitrogen_mg_kg"] = val
        except ValueError:
            pass

    # 3. Phosphorus pattern (e.g., "Phosphorus: 15 mg/kg", "Available P : 35 kg/ha", "P2O5: 18")
    p_match = re.search(
        r"(?:available\s*)?(?:phosphorus|p2o5|p)[\s:=]+([0-9]+(?:\.[0-9]+)?)\s*(mg/kg|ppm|kg/ha)?",
        text,
        re.IGNORECASE
    )
    if p_match:
        try:
            val = float(p_match.group(1))
            unit = (p_match.group(2) or "mg/kg").lower()
            if unit == "kg/ha":
                val = round(val / 2.24, 2)
            result["phosphorus_mg_kg"] = val
        except ValueError:
            pass

    # 4. Potassium pattern (e.g., "Potassium: 160 mg/kg", "Available K : 280 kg/ha", "K2O: 140")
    k_match = re.search(
        r"(?:available\s*)?(?:potassium|k2o|k)[\s:=]+([0-9]+(?:\.[0-9]+)?)\s*(mg/kg|ppm|kg/ha)?",
        text,
        re.IGNORECASE
    )
    if k_match:
        try:
            val = float(k_match.group(1))
            unit = (k_match.group(2) or "mg/kg").lower()
            if unit == "kg/ha":
                val = round(val / 2.24, 2)
            result["potassium_mg_kg"] = val
        except ValueError:
            pass

    # 5. Organic Carbon (OC %)
    oc_match = re.search(r"(?:organic\s*carbon|oc)[\s:=]+([0-9]+(?:\.[0-9]+)?)\s*%", text, re.IGNORECASE)
    if oc_match:
        try:
            result["organic_carbon_percent"] = float(oc_match.group(1))
        except ValueError:
            pass

    # 6. Electrical Conductivity (EC dS/m)
    ec_match = re.search(r"(?:electrical\s*conductivity|ec)[\s:=]+([0-9]+(?:\.[0-9]+)?)\s*(?:ds/m|mmhos/cm)?", text, re.IGNORECASE)
    if ec_match:
        try:
            result["electrical_conductivity_ds_m"] = float(ec_match.group(1))
        except ValueError:
            pass

    # 7. Lab name or department
    lab_match = re.search(r"(?:laboratory|lab|centre|testing center|kvk)[\s:]+([A-Za-z0-9\s,.-]{5,60})", text, re.IGNORECASE)
    if lab_match:
        result["lab_name"] = lab_match.group(1).strip()

    return result


def parse_soil_document(file_bytes: bytes, filename: str) -> Tuple[Dict[str, Any], str, str]:
    """
    Parses uploaded file and returns (extracted_values, status, message).
    Never claims 100% extraction without letting user verify.
    """
    filename_lower = filename.lower()
    raw_text = ""

    if filename_lower.endswith(".pdf"):
        raw_text = extract_text_from_pdf(file_bytes)
    elif filename_lower.endswith((".txt", ".csv")):
        try:
            raw_text = file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            raw_text = file_bytes.decode("latin-1", errors="ignore")
    elif filename_lower.endswith((".jpg", ".jpeg", ".png")):
        # Check if pytesseract is installed
        try:
            import pytesseract
            from PIL import Image
            image = Image.open(io.BytesIO(file_bytes))
            raw_text = pytesseract.image_to_string(image)
        except Exception as e:
            # OCR library or tesseract binary not installed
            return (
                {"nitrogen_mg_kg": None, "phosphorus_mg_kg": None, "potassium_mg_kg": None, "soil_ph": None},
                "partial",
                "Image uploaded. Optical Character Recognition (OCR) is not installed on this server. Please enter the values manually in the confirmation form below."
            )
    else:
        return ({}, "failed", f"Unsupported file extension '{filename}'. Please upload a PDF, PNG, or JPG.")

    if not raw_text.strip():
        return (
            {"nitrogen_mg_kg": None, "phosphorus_mg_kg": None, "potassium_mg_kg": None, "soil_ph": None},
            "failed",
            "Could not extract digital text from this document. Please enter your soil values in the editable form below."
        )

    parsed = extract_soil_values_from_text(raw_text)

    # Determine extraction success
    found_count = sum(1 for k in ["nitrogen_mg_kg", "phosphorus_mg_kg", "potassium_mg_kg", "soil_ph"] if parsed.get(k) is not None)

    if found_count == 4:
        status = "success"
        msg = "Successfully extracted N, P, K and pH values! Please review and verify the numbers below before saving."
    elif found_count > 0:
        status = "partial"
        msg = f"Extracted {found_count} of 4 soil parameters. Please review and fill in any missing values below."
    else:
        status = "failed"
        msg = "Document text was scanned, but standard soil nutrient labels (N, P, K, pH) were not recognized. Please type them manually below."

    return parsed, status, msg
