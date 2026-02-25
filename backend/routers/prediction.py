from fastapi import APIRouter, UploadFile, File, HTTPException
from ml_infer import ModelLoader
import numpy as np
import pandas as pd
import os

router = APIRouter()

@router.post("/api/upload-csv")
def upload_csv(file: UploadFile = File(...), model: str = "cnn", mode: str = "class"):
    if file.size > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large")
    df = pd.read_csv(file.file)
    # Preprocessing: numeric only
    X = df.select_dtypes(include=[np.number]).values
    loader = ModelLoader(f"{model}_model.pt")
    preds, confs = loader.predict(X)
    summary = {
        "benign": int((preds == 0).sum()),
        "attack": int((preds == 1).sum()),
        "latency": 0.1,
        "demo_mode": loader.demo_mode
    }
    results = [
        {"row_id": i, "prediction": int(preds[i]), "confidence": float(confs[i])}
        for i in range(len(preds))
    ]
    return {"run_id": 1, "summary": summary, "results": results}

@router.post("/api/predict")
def predict(features: dict):
    X = np.array([list(features.values())])
    loader = ModelLoader("cnn_model.pt")
    preds, confs = loader.predict(X)
    return {"prediction": int(preds[0]), "confidence": float(confs[0]), "latency": 0.05}
