import json
import logging
from typing import List, Dict, Any

from app.services.openrouter import chat_completion
from app.services.voice_command_parser import HybridIntentClassifier
from app.services.voice_intents import INTENT_REGISTRY, VoiceIntent
from app.services.voice_tools import ALL_TOOLS

logger = logging.getLogger(__name__)

# Reusing the existing classifier for exact fallback/deterministic matches
classifier = HybridIntentClassifier(INTENT_REGISTRY)

def get_tool_schemas() -> List[dict]:
    schemas = []
    for tool in ALL_TOOLS:
        schema = tool.model_json_schema()
        # Simplify the schema for LLM consumption
        schemas.append({
            "name": schema.get("title", ""),
            "description": schema.get("description", ""),
            "parameters": schema.get("properties", {})
        })
    return schemas

def run_llm_planner(transcript: str, context: dict) -> List[dict]:
    sys_prompt = f"""You are AROMI Voice Orchestrator. 
Convert the user's natural language request into a sequence of tool calls.
Available Tools:
{json.dumps(get_tool_schemas(), indent=2)}

Context:
{json.dumps(context, indent=2)}

Respond ONLY with a JSON array of tool calls. 
Example:
[
  {{"tool": "SEARCH_RECORDS", "location": "Pune"}},
  {{"tool": "OPEN_RECORD", "result_index": 1}}
]
"""
    try:
        response_text = chat_completion(
            messages=[
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": transcript}
            ]
        )
        # Attempt to parse JSON array
        # Clean up possible markdown fences
        clean_text = response_text.replace("`json", "").replace("`", "").strip()
        tools = json.loads(clean_text)
        if isinstance(tools, list):
            return tools
        elif isinstance(tools, dict):
            return [tools]
        return []
    except Exception as e:
        logger.error(f"LLM planner failed: {e}")
        return []

def plan_voice_action(transcript: str, context: dict) -> List[dict]:
    # 1. Deterministic check for exact 50 commands compatibility
    intent, conf = classifier.classify(transcript)
    if conf >= 0.85:
        # It's an exact known command. We can map it directly to a tool or return it as an exact legacy intent
        # For seamless integration, we'll return a special legacy tool
        return [{"tool": "LEGACY_INTENT", "intent": intent}]

    # 2. LLM Planner
    llm_plan = run_llm_planner(transcript, context)
    return llm_plan
