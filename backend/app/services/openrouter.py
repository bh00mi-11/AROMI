import httpx
from app.config import settings


def get_client() -> httpx.AsyncClient:
    return httpx.AsyncClient(
        base_url=settings.OPENROUTER_BASE_URL,
        headers={
            "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://aromi-anganwadi.app",
            "X-Title": "AROMI Anganwadi Assistant",
        },
        timeout=30.0,
    )


async def chat_completion(messages: list, model: str = None, max_tokens: int = 1500) -> str:
    if not settings.OPENROUTER_API_KEY or settings.OPENROUTER_API_KEY.startswith("your_"):
        raise ValueError("OpenRouter API key is not configured.")

    async with get_client() as client:
        payload = {
            "model": model or settings.LLM_MODEL,
            "messages": messages,
            "max_tokens": max_tokens,
        }
        response = await client.post("/chat/completions", json=payload)
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]
