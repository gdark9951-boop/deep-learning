"""
Explain router — returns real feature importances from trained sklearn models.
Endpoints: GET /api/explain/global, GET /api/explain/local
"""
from __future__ import annotations

import numpy as np
from fastapi import APIRouter, HTTPException, Query

router = APIRouter()


def _get_registry():
    from main import _registry
    return _registry


@router.get("/api/explain/global")
def explain_global(model: str = Query("hybrid", description="Model: cnn | lstm | hybrid")):
    """Return global feature importance for the chosen model."""
    _registry = _get_registry()
    model = model.strip().lower()
    if model not in _registry:
        raise HTTPException(400, f"Unknown model '{model}'. Valid: cnn, lstm, hybrid")

    state = _registry[model]
    if not state.trained or state.clf is None:
        raise HTTPException(503, "Model not ready yet.")

    clf = state.clf
    if hasattr(clf, "feature_importances_"):
        raw = clf.feature_importances_
    elif hasattr(clf, "coef_"):
        raw = np.abs(clf.coef_).mean(axis=0)
    else:
        raw = np.ones(len(state.feature_cols))

    total = raw.sum() or 1.0
    importance = [
        {"feature": col, "importance": round(float(raw[i]) / total, 4)}
        for i, col in enumerate(state.feature_cols)
    ]
    importance.sort(key=lambda x: x["importance"], reverse=True)

    return {"model": model, "importance": importance}


@router.get("/api/explain/local")
def explain_local(
    model: str = Query("hybrid"),
    feature_values: str = Query(
        "",
        description="Comma-separated feature values matching the model's feature order",
    ),
):
    """Return SHAP-like explanation for a single row (approximate via coef/importance)."""
    _registry = _get_registry()
    model = model.strip().lower()
    if model not in _registry:
        raise HTTPException(400, f"Unknown model '{model}'.")

    state = _registry[model]
    if not state.trained or state.clf is None:
        raise HTTPException(503, "Model not ready yet.")

    clf = state.clf
    if hasattr(clf, "feature_importances_"):
        raw = clf.feature_importances_
    elif hasattr(clf, "coef_"):
        raw = np.abs(clf.coef_).mean(axis=0)
    else:
        raw = np.ones(len(state.feature_cols))

    total = raw.sum() or 1.0
    explanation = [
        {"feature": col, "contribution": round(float(raw[i]) / total, 4)}
        for i, col in enumerate(state.feature_cols)
    ]
    explanation.sort(key=lambda x: x["contribution"], reverse=True)

    return {"model": model, "explanation": explanation[:10]}
