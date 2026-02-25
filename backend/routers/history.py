from fastapi import APIRouter

router = APIRouter()

@router.get("/api/history")
def get_history(page: int = 1, limit: int = 20):
    return {"runs": [], "page": page, "limit": limit}

@router.get("/api/runs")
def get_runs(page: int = 1, limit: int = 20):
    return {"runs": [], "page": page, "limit": limit}

@router.get("/api/runs/{run_id}")
def get_run(run_id: int):
    return {"run_id": run_id, "results": []}
