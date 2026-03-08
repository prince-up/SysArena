import time
from collections import defaultdict

_request_counts: dict[str, int] = defaultdict(int)
_latency_ms: dict[str, list[float]] = defaultdict(list)


def record_request(path: str, status_code: int, duration_ms: float) -> None:
    key = f"{path}:{status_code}"
    _request_counts[key] += 1
    _latency_ms[path].append(duration_ms)


def snapshot() -> dict[str, dict[str, float]]:
    data: dict[str, dict[str, float]] = {}
    for path, latencies in _latency_ms.items():
        if not latencies:
            continue
        data[path] = {
            "count": float(len(latencies)),
            "p50_ms": _percentile(latencies, 50),
            "p95_ms": _percentile(latencies, 95),
        }
    counts = {key: float(value) for key, value in _request_counts.items()}
    return {"latency": data, "counts": counts}


def _percentile(values: list[float], percentile: int) -> float:
    if not values:
        return 0.0
    values_sorted = sorted(values)
    index = int((percentile / 100) * (len(values_sorted) - 1))
    return values_sorted[index]


def now_ms() -> float:
    return time.time() * 1000.0
