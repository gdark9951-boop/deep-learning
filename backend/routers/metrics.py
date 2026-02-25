from fastapi import APIRouter

router = APIRouter()

@router.get("/api/metrics")
def get_metrics(run_id: int):
    return {"accuracy": 0.95, "precision": 0.92, "recall": 0.93, "f1": 0.94, "auc": 0.96}

@router.get("/api/charts")
def get_charts(from_: str = None, to: str = None, model: str = None):
    return {"detections": [], "attacks": [], "performance": []}
