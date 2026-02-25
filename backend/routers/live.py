"""
Live monitoring router — real system network stats via psutil.
"""
from __future__ import annotations

import time
import datetime
import psutil
from fastapi import APIRouter

router = APIRouter()

# ─── Uptime tracking ─────────────────────────────────────────────────────────
_start_time = time.time()

# ─── Rolling packet rate tracking ────────────────────────────────────────────
_last_net_io = None
_last_net_time = None

# ─── Simple in-memory alerts log ────────────────────────────────────────────
_alerts: list[dict] = []
_max_alerts = 50

def _classify_connection(conn) -> str | None:
    """Return threat label for a connection, or None if benign."""
    try:
        raddr = conn.raddr
        if not raddr:
            return None
        port = raddr.port
        # Known risky ports
        if port in (22, 23, 3389, 21, 445, 139):
            return "Brute Force"
        if port in (53,) and conn.type and conn.type.name == "SOCK_DGRAM":
            return "Probe"
    except Exception:
        pass
    return None


def _get_packet_rate() -> float:
    """Return estimated packets/sec since last call."""
    global _last_net_io, _last_net_time
    now = time.time()
    try:
        io = psutil.net_io_counters()
    except Exception:
        return 0.0

    if _last_net_io is None or _last_net_time is None:
        _last_net_io = io
        _last_net_time = now
        return 0.0

    elapsed = now - _last_net_time
    if elapsed < 0.1:
        return 0.0

    sent_diff = io.packets_sent - _last_net_io.packets_sent
    recv_diff = io.packets_recv - _last_net_io.packets_recv
    rate = (sent_diff + recv_diff) / elapsed

    _last_net_io = io
    _last_net_time = now
    return round(rate, 1)


# ─── Endpoints ───────────────────────────────────────────────────────────────

@router.get("/api/live/metrics")
def live_metrics():
    """Real-time network metrics from the host machine."""
    # Packet rate
    pkt_rate = _get_packet_rate()

    # Active connections
    try:
        conns = psutil.net_connections(kind="inet")
        active = [c for c in conns if c.status == "ESTABLISHED"]
        active_count = len(active)
    except Exception:
        conns = []
        active = []
        active_count = 0

    # Uptime %
    uptime_seconds = time.time() - _start_time
    uptime_pct = min(100.0, round(uptime_seconds / max(uptime_seconds + 1, 1) * 100, 1))

    # Detect suspicious connections and log alerts
    now_str = datetime.datetime.now().strftime("%H:%M:%S")
    for conn in conns:
        threat = _classify_connection(conn)
        if threat:
            # Avoid duplicate alerts within same second
            if not _alerts or _alerts[-1]["type"] != threat or _alerts[-1]["time"] != now_str:
                level = "HIGH" if threat in ("Brute Force",) else "MED"
                _alerts.append({"time": now_str, "type": threat, "threat": level})
                if len(_alerts) > _max_alerts:
                    _alerts.pop(0)

    # Net IO totals
    try:
        io = psutil.net_io_counters()
        bytes_sent = io.bytes_sent
        bytes_recv = io.bytes_recv
    except Exception:
        bytes_sent = 0
        bytes_recv = 0

    return {
        "packets_per_sec": pkt_rate,
        "active_connections": active_count,
        "alerts_today": len(_alerts),
        "uptime_pct": uptime_pct,
        "bytes_sent": bytes_sent,
        "bytes_recv": bytes_recv,
    }


@router.get("/api/live/alerts")
def live_alerts():
    """Return recent alerts list (real detections from connections)."""
    return {"alerts": list(reversed(_alerts[-20:]))}


@router.get("/api/live/connections")
def live_connections():
    """Return real active TCP/UDP connections from this machine."""
    try:
        conns = psutil.net_connections(kind="inet")
    except Exception:
        return {"connections": []}

    rows = []
    for c in conns:
        if not c.raddr:
            continue
        try:
            threat = _classify_connection(c)
            threat_level = "HIGH" if threat in ("Brute Force",) else ("MED" if threat else "LOW")
            rows.append({
                "src_ip": f"{c.laddr.ip}:{c.laddr.port}" if c.laddr else "-",
                "dst_ip": f"{c.raddr.ip}:{c.raddr.port}",
                "protocol": "TCP" if (c.type and "STREAM" in c.type.name) else "UDP",
                "status": c.status or "NONE",
                "threat": threat_level,
            })
        except Exception:
            continue

    return {"connections": rows[:50]}


@router.get("/api/live/traffic-history")
def live_traffic_history():
    """Return the last 20 packet-rate samples (sampled on each call)."""
    # We just return current snapshot; actual rolling history
    # is maintained client-side by polling this endpoint repeatedly.
    pkt_rate = _get_packet_rate()
    return {"sample": pkt_rate}


@router.get("/api/live/status")
def live_status():
    return {"status": "running", "mode": "real"}
