from fastapi import APIRouter

router = APIRouter()

@router.get("/api/network/graph")
def network_graph(from_: str = None, to: str = None):
    return {"nodes": [], "edges": []}

@router.get("/api/network/node/{id}")
def network_node(id: int):
    return {"node": {"id": id, "top_ports": [], "last_alerts": []}}
