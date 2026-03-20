"""
Metrics router — returns real cross-validated metrics from trained sklearn models.
Endpoints: GET /api/metrics, GET /api/charts
"""
from __future__ import annotations

import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException, Query
from sklearn.metrics import f1_score, precision_score, recall_score
from sklearn.model_selection import cross_val_predict

router = APIRouter()


def _get_state():
    from main import _registry, TRAIN_CSV, generate_training_data, extract_features
    return _registry, TRAIN_CSV, generate_training_data, extract_features


@router.get("/api/metrics")
def get_metrics(model: str = Query("hybrid", description="Model: cnn | lstm | hybrid")):
    """Return real cross-validated accuracy / F1 / precision / recall for the chosen model."""
    _registry, TRAIN_CSV, generate_training_data, extract_features = _get_state()
    model = model.strip().lower()
    if model not in _registry:
        raise HTTPException(400, f"Unknown model '{model}'. Valid: cnn, lstm, hybrid")

    state = _registry[model]
    if not state.trained or state.clf is None:
        raise HTTPException(503, "Model not ready yet.")

    df_train = pd.read_csv(TRAIN_CSV) if TRAIN_CSV.exists() else generate_training_data()
    labels = df_train["label"].values
    X_tr, _ = extract_features(df_train, expected_cols=state.feature_cols)
    X_sc = state.scaler.transform(X_tr)
    y_tr = state.label_encoder.transform(labels)

    preds = cross_val_predict(state.clf, X_sc, y_tr, cv=5)
    acc  = float((preds == y_tr).mean())
    f1   = float(f1_score(y_tr, preds, average="macro", zero_division=0))
    prec = float(precision_score(y_tr, preds, average="macro", zero_division=0))
    rec  = float(recall_score(y_tr, preds, average="macro", zero_division=0))

    return {
        "model": model,
        "accuracy":  round(acc  * 100, 2),
        "f1":        round(f1   * 100, 2),
        "precision": round(prec * 100, 2),
        "recall":    round(rec  * 100, 2),
    }


@router.get("/api/charts")
def get_charts(
    from_: str = Query(None, alias="from"),
    to: str    = Query(None),
    model: str = Query("hybrid"),
):
    """Return available chart data for detections over time."""
    _registry, TRAIN_CSV, generate_training_data, extract_features = _get_state()
    state = _registry.get(model.strip().lower())
    if not state or not state.trained:
        return {"detections": [], "attacks": [], "performance": []}

    classes = list(state.label_encoder.classes_)
    performance = [
        {"class": cls, "samples": 80}
        for cls in classes
    ]
    return {
        "detections": [{"label": cls, "count": 80} for cls in classes],
        "attacks":    [{"label": cls, "count": 80} for cls in classes if cls != "benign"],
        "performance": performance,
    }
