from fastapi import APIRouter

router = APIRouter()

@router.get("/api/explain/global")
def explain_global(run_id: int):
    # Demo: random importance
    return {"importance": [0.2, 0.3, 0.5]}

@router.get("/api/explain/local")
def explain_local(run_id: int, row_id: int):
    # Demo: random explanation
    return {"features": [0.1, 0.4, 0.5]}
