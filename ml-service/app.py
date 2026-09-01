import os
import sys
import io
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'ml', 'src'))
try:
    from predict import SugarcanePredictor
except ImportError:
    from ml.src.predict import SugarcanePredictor

app = FastAPI(
    title="KrishSathi Sugarcane ML Inference Service",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

predictor = None

@app.on_event("startup")
def load_predictor():
    global predictor
    try:
        predictor = SugarcanePredictor(confidence_threshold=0.60)
        print("Sugarcane Predictor Model loaded successfully!")
    except Exception as e:
        print(f"Warning during model loading: {e}")

@app.get("/")
def health_check():
    return {
        "service": "KrishSathi Sugarcane ML Service",
        "status": "online",
        "model_loaded": predictor is not None
    }

@app.post("/predict")
async def predict_sugarcane_disease(image: UploadFile = File(...)):
    global predictor
    if predictor is None:
        try:
            predictor = SugarcanePredictor(confidence_threshold=0.60)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Model loading error: {str(e)}")

    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file is not a valid image.")

    try:
        contents = await image.read()
        pil_image = Image.open(io.BytesIO(contents)).convert("RGB")
        result = predictor.predict_image(pil_image)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=5001, reload=True)
