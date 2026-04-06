import json, hashlib
from typing import Optional
import redis.asyncio as aioredis
from app.core.config import settings

redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)

TTL = {
    "questions":       3600,
    "dashboard":        300,
    "at_risk":          600,
    "report":          1800,
    "recommendations":  900,
}

def make_cache_key(prefix: str, **kwargs) -> str:
    raw = json.dumps(kwargs, sort_keys=True)
    h = hashlib.md5(raw.encode()).hexdigest()[:8]
    return f"edulink:{prefix}:{h}"

async def get_cache(key: str) -> Optional[dict]:
    try:
        val = await redis_client.get(key)
        return json.loads(val) if val else None
    except Exception:
        return None

async def set_cache(key: str, data: dict, ttl: int) -> None:
    try:
        await redis_client.setex(key, ttl, json.dumps(data, ensure_ascii=False))
    except Exception:
        pass

async def invalidate(prefix: str) -> None:
    try:
        keys = await redis_client.keys(f"edulink:{prefix}:*")
        if keys:
            await redis_client.delete(*keys)
    except Exception:
        pass
