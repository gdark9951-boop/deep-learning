from pydantic import BaseModel

class PredictionResult(BaseModel):
    row_id: int
    prediction: int
    confidence: float
    attack_type: str = None
    score: float = None

class RunSummary(BaseModel):
    benign: int
    attack: int
    latency: float
    demo_mode: bool
