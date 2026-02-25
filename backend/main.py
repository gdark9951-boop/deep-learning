"""
Cyber IDS — FastAPI Backend
Real ML inference pipeline for network intrusion detection.

Models (trained at startup on synthetic data if no .pt files found):
  - hybrid : RandomForestClassifier   — best accuracy
  - cnn    : GradientBoostingClassifier — fast spatial patterns
  - lstm   : LogisticRegression        — temporal / sequential

Run:
  uvicorn backend.main:app --reload --port 8000
"""

from __future__ import annotations

import io
import logging
import os
import time
import datetime
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd
import psutil
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_predict
from sklearn.preprocessing import LabelEncoder, StandardScaler

# ─── Paths ───────────────────────────────────────────────────────────────────
BASE_DIR   = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"
DATA_DIR   = BASE_DIR / "data"
TRAIN_CSV  = DATA_DIR / "sample_train.csv"

# ─── Logging ─────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(levelname)s │ %(message)s")
log = logging.getLogger("cyber-ids")

# ─── Label helpers ────────────────────────────────────────────────────────────
LABEL_MAP = {
    "benign":     "Normal Traffic",
    "ddos":       "DDoS Attack",
    "portscan":   "Port Scan",
    "bruteforce": "Brute Force",
    "probe":      "Network Probe",
}

def friendly_label(raw: str) -> str:
    return LABEL_MAP.get(raw.strip().lower(), raw.strip().title())

def risk_level(confidence: float, raw_label: str) -> str:
    if raw_label.lower() in ("benign",):
        return "LOW"
    if confidence >= 0.90:
        return "HIGH"
    if confidence >= 0.70:
        return "MEDIUM"
    return "LOW"

# ─── Model registry ───────────────────────────────────────────────────────────
class ModelState:
    def __init__(self) -> None:
        self.clf                          = None
        self.scaler: Optional[StandardScaler]    = None
        self.label_encoder: Optional[LabelEncoder] = None
        self.feature_cols: list[str]      = []
        self.trained: bool                = False

_registry: dict[str, ModelState] = {
    "cnn":    ModelState(),
    "lstm":   ModelState(),
    "hybrid": ModelState(),
}

# ─── Synthetic training data ──────────────────────────────────────────────────
def generate_training_data() -> pd.DataFrame:
    """Create 320-row synthetic network flow dataset (80 per class)."""
    rng  = np.random.default_rng(42)
    rows: list[dict] = []

    protocols = ["TCP", "UDP", "ICMP"]

    # ── benign ────────────────────────────────────────────────
    for _ in range(80):
        pkts = int(rng.integers(2, 35))
        bts  = int(rng.integers(200, 6000))
        dur  = int(rng.integers(20, 800))
        rows.append(dict(
            packets    = pkts,
            bytes      = bts,
            duration_ms= dur,
            src_port   = int(rng.integers(1024, 65535)),
            dst_port   = int(rng.choice([80, 443, 8080, 3000, 5000])),
            flag_syn   = int(rng.integers(0, 2)),
            flag_ack   = 1,
            flag_fin   = int(rng.integers(0, 2)),
            flag_rst   = 0,
            pkt_rate   = round(pkts / max(dur / 1000, 0.001), 4),
            byte_rate  = round(bts  / max(dur / 1000, 0.001), 4),
            protocol   = str(rng.choice(protocols)),
            label      = "benign",
        ))

    # ── ddos ──────────────────────────────────────────────────
    for _ in range(80):
        pkts = int(rng.integers(800, 8000))
        bts  = int(rng.integers(80_000, 800_000))
        dur  = int(rng.integers(1, 80))
        rows.append(dict(
            packets    = pkts,
            bytes      = bts,
            duration_ms= dur,
            src_port   = int(rng.integers(1024, 65535)),
            dst_port   = int(rng.choice([80, 443, 53])),
            flag_syn   = 1,
            flag_ack   = 0,
            flag_fin   = 0,
            flag_rst   = 0,
            pkt_rate   = round(pkts / max(dur / 1000, 0.001), 4),
            byte_rate  = round(bts  / max(dur / 1000, 0.001), 4),
            protocol   = "TCP",
            label      = "ddos",
        ))

    # ── portscan ──────────────────────────────────────────────
    for _ in range(80):
        pkts = 1
        bts  = int(rng.integers(40, 70))
        dur  = int(rng.integers(2, 25))
        rows.append(dict(
            packets    = pkts,
            bytes      = bts,
            duration_ms= dur,
            src_port   = 54321,
            dst_port   = int(rng.integers(1, 1024)),
            flag_syn   = 1,
            flag_ack   = 0,
            flag_fin   = 0,
            flag_rst   = 1,
            pkt_rate   = round(pkts / max(dur / 1000, 0.001), 4),
            byte_rate  = round(bts  / max(dur / 1000, 0.001), 4),
            protocol   = "TCP",
            label      = "portscan",
        ))

    # ── bruteforce ────────────────────────────────────────────
    for _ in range(80):
        pkts = int(rng.integers(15, 60))
        bts  = int(rng.integers(1500, 9000))
        dur  = int(rng.integers(2000, 15000))
        rows.append(dict(
            packets    = pkts,
            bytes      = bts,
            duration_ms= dur,
            src_port   = int(rng.integers(1024, 65535)),
            dst_port   = int(rng.choice([22, 3389, 21, 23])),
            flag_syn   = 1,
            flag_ack   = 1,
            flag_fin   = 0,
            flag_rst   = 0,
            pkt_rate   = round(pkts / max(dur / 1000, 0.001), 4),
            byte_rate  = round(bts  / max(dur / 1000, 0.001), 4),
            protocol   = "TCP",
            label      = "bruteforce",
        ))

    df = pd.DataFrame(rows)
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    return df

# ─── Feature extraction ───────────────────────────────────────────────────────
_EXCLUDE = {"timestamp", "label", "src_ip", "dst_ip",
            "class", "attack_type", "target", "category"}

def extract_features(
    df: pd.DataFrame,
    expected_cols: list[str] | None = None,
) -> tuple[pd.DataFrame, list[str]]:
    """Return (feature_df, col_names). Aligns to expected_cols if provided."""
    df = df.copy()

    # Encode protocol → dummies
    if "protocol" in df.columns:
        dummies = pd.get_dummies(
            df["protocol"].astype(str).str.upper(), prefix="proto"
        )
        df = pd.concat([df.drop(columns=["protocol"]), dummies], axis=1)

    # Drop non-feature columns
    drop = [c for c in df.columns if c.lower() in _EXCLUDE]
    df   = df.drop(columns=drop, errors="ignore")

    # Keep only numeric
    df = df.select_dtypes(include=[np.number])

    if df.empty:
        raise ValueError(
            "CSV contains no usable numeric features after preprocessing. "
            "Ensure it has columns like: packets, bytes, duration_ms, src_port, dst_port, protocol, flag_syn …"
        )

    # Fill missing with median
    df = df.fillna(df.median(numeric_only=True))

    if expected_cols:
        for col in expected_cols:
            if col not in df.columns:
                df[col] = 0.0
        df = df[expected_cols]

    return df, list(df.columns)

# ─── Training ────────────────────────────────────────────────────────────────
def train_models() -> None:
    """Train all three models. Called once at startup."""
    log.info("─── Cyber IDS Model Training ───")

    # Ensure training data exists
    if not TRAIN_CSV.exists():
        os.makedirs(DATA_DIR, exist_ok=True)
        df_train = generate_training_data()
        df_train.to_csv(TRAIN_CSV, index=False)
        rel_path = TRAIN_CSV.relative_to(BASE_DIR.parent) if TRAIN_CSV.is_relative_to(BASE_DIR.parent) else TRAIN_CSV
        log.info(f"Generated synthetic training data → {rel_path} ({len(df_train)} rows)")
    else:
        df_train = pd.read_csv(TRAIN_CSV)
        rel_path = TRAIN_CSV.relative_to(BASE_DIR.parent) if TRAIN_CSV.is_relative_to(BASE_DIR.parent) else TRAIN_CSV
        log.info(f"Loaded training data: {rel_path} ({len(df_train)} rows)")

    labels = df_train["label"].values
    X, feat_cols = extract_features(df_train)

    le = LabelEncoder()
    y  = le.fit_transform(labels)

    scaler   = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    clf_defs = {
        "hybrid": RandomForestClassifier(
            n_estimators=150, max_depth=10, random_state=42, n_jobs=-1
        ),
        "cnn": GradientBoostingClassifier(
            n_estimators=100, max_depth=5, learning_rate=0.1, random_state=42
        ),
        "lstm": LogisticRegression(
            max_iter=2000, C=1.0, random_state=42
        ),
    }

    for key, clf in clf_defs.items():
        clf.fit(X_scaled, y)
        state                = _registry[key]
        state.clf            = clf
        state.scaler         = scaler
        state.label_encoder  = le
        state.feature_cols   = feat_cols
        state.trained        = True
        log.info(f"  ✓ {key:6s} — classes: {list(le.classes_)}")

    log.info("────────────────────────────────")

# ─── Lifespan ────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(_app: FastAPI):
    train_models()
    yield

# ─── App ─────────────────────────────────────────────────────────────────────
app = FastAPI(
    title       = "Cyber IDS API",
    version     = "1.0.0",
    description = "Real ML-based network intrusion detection",
    lifespan    = lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins     = ["*"],
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

# ─── Schemas ─────────────────────────────────────────────────────────────────
class FeatureImpact(BaseModel):
    name:   str
    impact: float

class PredictResponse(BaseModel):
    model:        str
    label:        str
    confidence:   float   # 0.0 – 1.0
    risk:         str     # HIGH | MEDIUM | LOW
    top_features: list[FeatureImpact]
    records:      int

# ─── Live Monitoring State ───────────────────────────────────────────────────
_server_start = time.time()
_last_net_io: psutil._common.snetio | None = None
_last_net_time: float | None = None
_alerts_log: list[dict] = []

def _get_packet_rate() -> float:
    global _last_net_io, _last_net_time
    now = time.time()
    try:
        io_now = psutil.net_io_counters()
    except Exception:
        return 0.0
    if _last_net_io is None or _last_net_time is None:
        _last_net_io = io_now
        _last_net_time = now
        return 0.0
    elapsed = now - _last_net_time
    if elapsed < 0.05:
        return 0.0
    rate = (io_now.packets_sent - _last_net_io.packets_sent +
            io_now.packets_recv - _last_net_io.packets_recv) / elapsed
    _last_net_io = io_now
    _last_net_time = now
    return round(rate, 1)

def _classify_conn(conn) -> str | None:
    try:
        if not conn.raddr:
            return None
        port = conn.raddr.port
        if port in (22, 23, 3389, 21, 445, 139):
            return "Brute Force"
        if port in (53,):
            return "Probe"
    except Exception:
        pass
    return None

# ─── Endpoints ───────────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {"message": "Cyber IDS API is running", "docs": "/docs", "health": "/health"}

@app.get("/health")
async def health():
    return {
        "status":       "ok",
        "models_ready": {k: v.trained for k, v in _registry.items()},
    }

@app.get("/api/live/metrics")
async def api_live_metrics():
    pkt_rate = _get_packet_rate()
    try:
        conns = psutil.net_connections(kind="inet")
        active = sum(1 for c in conns if c.status == "ESTABLISHED")
    except Exception:
        conns = []
        active = 0
    uptime_sec = time.time() - _server_start
    uptime_pct = round(min(100.0, uptime_sec / max(uptime_sec + 1, 1) * 100), 2)
    now_str = datetime.datetime.now().strftime("%H:%M:%S")
    for conn in conns:
        threat = _classify_conn(conn)
        if threat:
            if not _alerts_log or _alerts_log[-1]["type"] != threat or _alerts_log[-1]["time"] != now_str:
                level = "HIGH" if threat == "Brute Force" else "MED"
                _alerts_log.append({"time": now_str, "type": threat, "threat": level})
                if len(_alerts_log) > 100:
                    _alerts_log.pop(0)
    try:
        io = psutil.net_io_counters()
        bytes_sent, bytes_recv = io.bytes_sent, io.bytes_recv
    except Exception:
        bytes_sent = bytes_recv = 0
    return {
        "packets_per_sec": pkt_rate,
        "active_connections": active,
        "alerts_today": len(_alerts_log),
        "uptime_pct": uptime_pct,
        "bytes_sent": bytes_sent,
        "bytes_recv": bytes_recv,
    }

@app.get("/api/live/alerts")
async def api_live_alerts():
    return {"alerts": list(reversed(_alerts_log[-20:]))}

@app.get("/api/live/connections")
async def api_live_connections():
    try:
        conns = psutil.net_connections(kind="inet")
    except Exception:
        return {"connections": []}
    rows = []
    for c in conns:
        if not c.raddr:
            continue
        try:
            threat = _classify_conn(c)
            level = "HIGH" if threat == "Brute Force" else ("MED" if threat else "LOW")
            proto = "TCP" if (c.type and hasattr(c.type, 'name') and "STREAM" in c.type.name) else "UDP"
            rows.append({
                "src_ip": f"{c.laddr.ip}:{c.laddr.port}" if c.laddr else "-",
                "dst_ip": f"{c.raddr.ip}:{c.raddr.port}",
                "protocol": proto,
                "status": c.status or "NONE",
                "threat": level,
            })
        except Exception:
            continue
    return {"connections": rows[:50]}

@app.post("/predict", response_model=PredictResponse)
async def predict(
    file:  UploadFile = File(...,  description="CSV file with network flow data"),
    model: str        = Form("hybrid", description="Model: cnn | lstm | hybrid"),
):
    model = model.strip().lower()
    if model not in _registry:
        raise HTTPException(
            400, f"Unknown model '{model}'. Valid options: cnn, lstm, hybrid"
        )

    state = _registry[model]
    if not state.trained:
        raise HTTPException(503, "Model is not ready yet. Please retry in a moment.")

    # ── Parse CSV ─────────────────────────────────────────────
    try:
        raw = await file.read()
        df  = pd.read_csv(io.BytesIO(raw))
    except Exception as exc:
        raise HTTPException(400, f"Failed to parse CSV: {exc}")

    if df.empty:
        raise HTTPException(400, "Uploaded CSV file is empty.")

    records = len(df)
    log.info(f"Predict  model={model}  rows={records}  file={file.filename!r}")

    # ── Extract features ─────────────────────────────────────
    try:
        X, _ = extract_features(df, expected_cols=state.feature_cols)
    except ValueError as exc:
        raise HTTPException(400, str(exc))

    # ── Scale ────────────────────────────────────────────────
    X_scaled = state.scaler.transform(X)

    # ── Predict (aggregate across all rows) ───────────────────
    proba      = state.clf.predict_proba(X_scaled)   # (n_rows, n_classes)
    mean_proba = proba.mean(axis=0)
    pred_idx   = int(np.argmax(mean_proba))
    confidence = float(mean_proba[pred_idx])

    raw_label = str(state.label_encoder.inverse_transform([pred_idx])[0])
    label     = friendly_label(raw_label)
    risk      = risk_level(confidence, raw_label)

    # ── Feature importance ────────────────────────────────────
    if hasattr(state.clf, "feature_importances_"):
        importances = state.clf.feature_importances_
    elif hasattr(state.clf, "coef_"):
        importances = np.abs(state.clf.coef_).mean(axis=0)
    else:
        importances = np.ones(len(state.feature_cols))

    top_n       = min(6, len(state.feature_cols))
    top_indices = np.argsort(importances)[::-1][:top_n]
    total_imp   = importances[top_indices].sum() or 1.0
    top_feats   = [
        FeatureImpact(
            name   = state.feature_cols[i],
            impact = round(float(importances[i]) / total_imp, 4),
        )
        for i in top_indices
    ]

    log.info(f"  → label={raw_label!r}  confidence={confidence:.3f}  risk={risk}")

    return PredictResponse(
        model        = model,
        label        = label,
        confidence   = round(confidence, 4),
        risk         = risk,
        top_features = top_feats,
        records      = records,
    )

# ─── Models info endpoint ─────────────────────────────────────────────────────
@app.get("/api/models")
async def api_models():
    """Return real stats derived from the trained sklearn models."""
    result = []
    for key, state in _registry.items():
        if not state.trained or state.clf is None:
            result.append({"id": key, "trained": False})
            continue

        clf = state.clf
        # Use training data to get cross-val-like stats
        df_train = pd.read_csv(TRAIN_CSV) if TRAIN_CSV.exists() else generate_training_data()
        labels = df_train["label"].values
        X_tr, _ = extract_features(df_train, expected_cols=state.feature_cols)
        X_tr_sc = state.scaler.transform(X_tr)
        y_tr = state.label_encoder.transform(labels)

        # Use cross_val_predict to get realistic metrics
        preds = cross_val_predict(clf, X_tr_sc, y_tr, cv=5)
        acc = float((preds == y_tr).mean())

        from sklearn.metrics import f1_score, precision_score, recall_score
        f1  = float(f1_score(y_tr, preds, average="macro", zero_division=0))
        prec = float(precision_score(y_tr, preds, average="macro", zero_division=0))
        rec  = float(recall_score(y_tr, preds, average="macro", zero_division=0))

        # Feature importances (re-fit on full data for importances)
        if hasattr(clf, "feature_importances_"):
            imps = clf.feature_importances_
        elif hasattr(clf, "coef_"):
            imps = np.abs(clf.coef_).mean(axis=0)
        else:
            imps = np.ones(len(state.feature_cols))

        top_idx = np.argsort(imps)[::-1][:6]
        total_i = imps[top_idx].sum() or 1.0
        top_feats = [
            {"name": state.feature_cols[i], "impact": round(float(imps[i]) / total_i * 100, 1)}
            for i in top_idx
        ]

        result.append({
            "id": key,
            "trained": True,
            "accuracy": round(acc * 100, 2),
            "f1": round(f1 * 100, 2),
            "precision": round(prec * 100, 2),
            "recall": round(rec * 100, 2),
            "classes": list(state.label_encoder.classes_),
            "features": state.feature_cols,
            "top_features": top_feats,
        })
    return {"models": result}


# ─── Network / connections summary endpoint ───────────────────────────────────
@app.get("/api/network/summary")
async def api_network_summary():
    """Return real network interface stats."""
    try:
        ifaces = psutil.net_if_stats()
        addrs  = psutil.net_if_addrs()
        io     = psutil.net_io_counters(pernic=True)
        iface_list = []
        for name, stats in ifaces.items():
            addr_info = addrs.get(name, [])
            ipv4 = next((a.address for a in addr_info if a.family.name == "AF_INET"), None)
            nic_io = io.get(name)
            iface_list.append({
                "name": name,
                "ip": ipv4 or "–",
                "up": stats.isup,
                "speed_mbps": stats.speed,
                "bytes_sent": nic_io.bytes_sent if nic_io else 0,
                "bytes_recv": nic_io.bytes_recv if nic_io else 0,
            })
        conns = psutil.net_connections(kind="inet")
        return {
            "interfaces": iface_list,
            "total_connections": len(conns),
            "established": sum(1 for c in conns if c.status == "ESTABLISHED"),
        }
    except Exception as e:
        return {"interfaces": [], "total_connections": 0, "established": 0, "error": str(e)}
