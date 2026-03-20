"""
Prediction router — uses the shared sklearn model registry from main.py.
Endpoints: POST /api/upload-csv, POST /api/predict
"""
from __future__ import annotations

import io
import logging
import time

import numpy as np
import pandas as pd
from fastapi import APIRouter, File, HTTPException, Query, UploadFile

log = logging.getLogger("cyber-ids")
router = APIRouter()


def _get_registry():
    """Lazy import to avoid circular dependency with main.py."""
    from main import _registry, extract_features, friendly_label, risk_level
    return _registry, extract_features, friendly_label, risk_level


@router.post("/api/upload-csv")
async def upload_csv(
    file: UploadFile = File(...),
    model: str = Query("hybrid", description="Model: cnn | lstm | hybrid"),
):
    """Upload a CSV file and run ML inference. Returns per-row results + summary."""
    _registry, extract_features, friendly_label, risk_level = _get_registry()

    model = model.strip().lower()
    if model not in _registry:
        raise HTTPException(400, f"Unknown model '{model}'. Valid: cnn, lstm, hybrid")

    state = _registry[model]
    if not state.trained:
        raise HTTPException(503, "Model not ready yet — please retry in a moment.")

    # --- parse CSV ---
    try:
        raw = await file.read()
        df = pd.read_csv(io.BytesIO(raw))
    except Exception as exc:
        raise HTTPException(400, f"Failed to parse CSV: {exc}")

    if df.empty:
        raise HTTPException(400, "Uploaded CSV is empty.")

    if file.size and file.size > 20 * 1024 * 1024:
        raise HTTPException(400, "File too large (max 20 MB).")

    # --- features ---
    try:
        X, _ = extract_features(df, expected_cols=state.feature_cols)
    except ValueError as exc:
        raise HTTPException(400, str(exc))

    # --- inference ---
    t0 = time.perf_counter()
    X_scaled = state.scaler.transform(X)
    proba = state.clf.predict_proba(X_scaled)          # (n_rows, n_classes)
    preds_idx = proba.argmax(axis=1)                   # per-row class index
    confs = proba.max(axis=1)                          # per-row confidence
    latency = round(time.perf_counter() - t0, 4)

    # --- labels ---
    raw_labels = state.label_encoder.inverse_transform(preds_idx)

    # --- summary ---
    benign_count = int((raw_labels == "benign").sum())
    attack_count = int(len(raw_labels) - benign_count)

    # mean proba for overall verdict
    mean_proba = proba.mean(axis=0)
    top_idx = int(np.argmax(mean_proba))
    top_raw = str(state.label_encoder.inverse_transform([top_idx])[0])

    summary = {
        "model": model,
        "total_rows": len(df),
        "benign": benign_count,
        "attack": attack_count,
        "overall_label": friendly_label(top_raw),
        "overall_confidence": round(float(mean_proba[top_idx]), 4),
        "overall_risk": risk_level(float(mean_proba[top_idx]), top_raw),
        "latency": latency,
        "demo_mode": False,
    }

    results = [
        {
            "row_id": i,
            "prediction": int(preds_idx[i]),
            "label": friendly_label(str(raw_labels[i])),
            "confidence": round(float(confs[i]), 4),
        }
        for i in range(len(preds_idx))
    ]

    log.info(f"upload-csv  model={model}  rows={len(df)}  latency={latency}s")
    return {"run_id": int(time.time()), "summary": summary, "results": results}


@router.post("/api/predict")
async def predict_features(features: dict):
    """Predict from a JSON dict of feature_name→value (single row)."""
    _registry, extract_features, friendly_label, risk_level = _get_registry()

    state = _registry["hybrid"]
    if not state.trained:
        raise HTTPException(503, "Model not ready yet.")

    try:
        df = pd.DataFrame([features])
        X, _ = extract_features(df, expected_cols=state.feature_cols)
        X_scaled = state.scaler.transform(X)
        proba = state.clf.predict_proba(X_scaled)[0]
        idx = int(np.argmax(proba))
        conf = float(proba[idx])
        raw_label = str(state.label_encoder.inverse_transform([idx])[0])
        return {
            "prediction": idx,
            "label": friendly_label(raw_label),
            "confidence": round(conf, 4),
            "risk": risk_level(conf, raw_label),
            "latency": 0.05,
        }
    except Exception as exc:
        raise HTTPException(400, f"Prediction error: {exc}")
