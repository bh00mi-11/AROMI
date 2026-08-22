import re
import difflib
from typing import Optional, Tuple, List, Dict, Any

from app.services.voice_intents import INTENT_REGISTRY, VoiceIntent
from app.services.voice_normalizer import normalize_text
from app.schemas.schemas import ChildCandidate

HINDI_NUMBER_WORDS = {
    "ek": 1, "one": 1, "do": 2, "two": 2, "teen": 3, "three": 3, "char": 4, "four": 4,
    "paanch": 5, "five": 5, "chheh": 6, "six": 6, "saat": 7, "seven": 7, "aath": 8, "eight": 8,
    "nau": 9, "nine": 9, "das": 10, "ten": 10, "gyarah": 11, "barah": 12, "terah": 13,
    "chaudah": 14, "pandrah": 15, "solah": 16, "sattrah": 17, "atharah": 18, "unnees": 19,
    "bees": 20, "ikkees": 21, "baees": 22, "teees": 23, "chaubees": 24, "pachees": 25,
    "so": 100, "sau": 100
}

DEVANAGARI_TO_ROMAN = {
    "राजू": "raju", "निकम": "nikam", "राहुल": "rahul", "शर्मा": "sharma"
}

def parse_hindi_number(text: str) -> Optional[float]:
    digit_match = re.search(r'(\d+\.?\d*)', text)
    if digit_match:
        try:
            val = float(digit_match.group(1))
            return val
        except ValueError:
            pass

    words = text.split()
    whole_part = None
    
    for word in words:
        clean_w = word.strip(",.!")
        if clean_w in HINDI_NUMBER_WORDS:
            whole_part = float(HINDI_NUMBER_WORDS[clean_w])
            break

    return whole_part

def transliterate_text(text: str) -> str:
    words = text.strip().split()
    roman_words = []
    for w in words:
        clean_w = w.strip(",.!")
        if clean_w in DEVANAGARI_TO_ROMAN:
            roman_words.append(DEVANAGARI_TO_ROMAN[clean_w])
        else:
            roman_words.append(clean_w.lower())
    return " ".join(roman_words)

def resolve_child(raw_name_query: Optional[str], worker_children: List[dict]) -> Tuple[Optional[dict], List[ChildCandidate]]:
    if not raw_name_query or not worker_children:
        return None, []

    normalized_query = raw_name_query.strip().lower()
    transliterated_query = transliterate_text(raw_name_query)

    for c in worker_children:
        c_name_lower = c["name"].strip().lower()
        if c_name_lower == normalized_query or c_name_lower == transliterated_query:
            return c, []

    query_tokens = set(transliterated_query.split())
    exact_full_matches = []
    for c in worker_children:
        c_tokens = set(c["name"].strip().lower().split())
        if query_tokens == c_tokens:
            exact_full_matches.append(c)

    if len(exact_full_matches) == 1:
        return exact_full_matches[0], []
    elif len(exact_full_matches) > 1:
        candidates = [ChildCandidate(id=c["id"], name=c["name"]) for c in exact_full_matches]
        return None, candidates

    query_first_name = transliterated_query.split()[0] if transliterated_query else normalized_query.split()[0]
    first_name_matches = []
    for c in worker_children:
        c_first_name = c["name"].strip().lower().split()[0]
        if c_first_name == query_first_name:
            first_name_matches.append(c)

    if len(first_name_matches) == 1:
        return first_name_matches[0], []
    elif len(first_name_matches) > 1:
        candidates = [ChildCandidate(id=c["id"], name=c["name"]) for c in first_name_matches]
        return None, candidates

    return None, []

def validate_measurement(weight_kg: float, previous_weight_kg: Optional[float] = None) -> Tuple[bool, Optional[str]]:
    if weight_kg <= 0.5 or weight_kg >= 60.0:
        return True, f"⚠️ असामान्य माप: सुना गया वजन {weight_kg} kg है। कृपया दोबारा जांचें।"

    if previous_weight_kg is not None and previous_weight_kg > 0:
        diff = abs(weight_kg - previous_weight_kg)
        if diff > (previous_weight_kg * 0.5) or diff > 6.0:
            return True, f"⚠️ असामान्य माप: नया वजन {weight_kg} kg है (पिछला: {previous_weight_kg} kg)। कृपया जांचें।"

    return False, None

class HybridIntentClassifier:
    def __init__(self, intent_registry: List[dict]):
        self.registry = intent_registry

    def classify(self, text: str) -> Tuple[str, float]:
        norm_text = normalize_text(text)
        
        best_intent = VoiceIntent.UNKNOWN.value
        best_score = 0.0
        
        for intent_data in self.registry:
            for example in intent_data.get("examples", []):
                norm_example = normalize_text(example)
                
                if norm_text == norm_example or norm_example in norm_text:
                    return intent_data["intent"].value, 1.0
                
                score = difflib.SequenceMatcher(None, norm_text, norm_example).ratio()
                if score > best_score:
                    best_score = score
                    best_intent = intent_data["intent"].value

        if best_score >= 0.75:
            return best_intent, best_score
            
        return VoiceIntent.UNKNOWN.value, best_score

def extract_entities(text: str, intent: str) -> dict:
    """Extract known entities from text based on intent."""
    entities = {}
    norm_text = normalize_text(text)
    
    # Check for IDs like AROMI-1024 or aromi ten twenty four
    id_match = re.search(r'aromi[\s-]?(\d+)', norm_text.lower())
    if id_match:
        entities["case_id"] = f"AROMI-{id_match.group(1)}"
        entities["report_id"] = f"AROMI-{id_match.group(1)}"
        
    # Check for person names
    # Heuristics: search for <person name>
    # Very basic: if "search for X"
    name_match = re.search(r'(?:search for|find|details for|record for|search) ([a-z\s]+)', norm_text.lower())
    if name_match:
        entities["person_name"] = name_match.group(1).strip()
    
    # Weight / Height
    weight_match = re.search(r'(?:weight|wazan|vazan|वजन)\s*(?:of|is|to)?\s*([0-9\.]+)\s*(?:kg|kilo)?', norm_text.lower())
    if weight_match:
        try:
            entities["weight_kg"] = float(weight_match.group(1))
        except ValueError:
            pass
            
    height_match = re.search(r'(?:height|unchai|ऊंचाई)\s*(?:of|is|to)?\s*([0-9\.]+)\s*(?:cm|centimeter)?', norm_text.lower())
    if height_match:
        try:
            entities["height_cm"] = float(height_match.group(1))
        except ValueError:
            pass

    return entities
