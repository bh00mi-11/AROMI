import httpx
from app.config import settings

_client: httpx.AsyncClient | None = None


def get_client() -> httpx.AsyncClient:
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(
            base_url=settings.OPENROUTER_BASE_URL,
            headers={
                "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://aromi-anganwadi.app",
                "X-Title": "AROMI Anganwadi Assistant",
            },
            timeout=60.0,
        )
    return _client


async def chat_completion(messages: list, model: str = None, max_tokens: int = 1500) -> str:
    client = get_client()
    payload = {
        "model": model or settings.LLM_MODEL,
        "messages": messages,
        "max_tokens": max_tokens,
    }
    response = await client.post("/chat/completions", json=payload)
    response.raise_for_status()
    data = response.json()
    return data["choices"][0]["message"]["content"]
