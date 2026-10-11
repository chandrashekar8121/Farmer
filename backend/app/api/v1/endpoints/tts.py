import urllib.parse
try:
    import httpx
except ImportError:
    httpx = None
try:
    import requests
except ImportError:
    requests = None

from fastapi import APIRouter, Query, Response
from pydantic import BaseModel

router = APIRouter()

class TranslationRequest(BaseModel):
    text: str
    target_lang: str = "en"

@router.post("/translate")
def translate_endpoint(req: TranslationRequest):
    if not req.text or req.target_lang == "en":
        return {"success": True, "translatedText": req.text}
    url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl={req.target_lang}&dt=t&q={urllib.parse.quote(req.text)}"
    try:
        if httpx:
            with httpx.Client(headers={"User-Agent": "Mozilla/5.0"}, timeout=5.0) as client:
                resp = client.get(url)
                data = resp.json()
        elif requests:
            resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=5)
            data = resp.json()
        else:
            return {"success": False, "translatedText": req.text}

        translated = "".join([item[0] for item in data[0]])
        return {"success": True, "translatedText": translated}
    except Exception as e:
        print("Translation error:", e)
        return {"success": False, "translatedText": req.text}

@router.get("/tts")
def tts_endpoint(text: str = Query(...), lang: str = Query("en")):
    if not text:
        return Response(status_code=400)
    query_text = text[:200]
    url = f"https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl={lang}&q={urllib.parse.quote(query_text)}"
    try:
        if httpx:
            with httpx.Client(headers={"User-Agent": "Mozilla/5.0"}, timeout=10.0) as client:
                resp = client.get(url)
                return Response(content=resp.content, media_type="audio/mpeg")
        elif requests:
            resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
            return Response(content=resp.content, media_type="audio/mpeg")
        else:
            return Response(status_code=500)
    except Exception as e:
        print("TTS error:", e)
        return Response(status_code=500)

