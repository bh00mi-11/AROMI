import re

# Common Hindi/Hinglish number words to digits
NUMBER_MAP = {
    "zero": "0", "shunya": "0", "ek": "1", "one": "1", "do": "2", "two": "2",
    "teen": "3", "three": "3", "char": "4", "four": "4", "paanch": "5", "five": "5",
    "chhah": "6", "six": "6", "saat": "7", "seven": "7", "aath": "8", "eight": "8",
    "nau": "9", "nine": "9", "das": "10", "ten": "10",
    "gyarah": "11", "eleven": "11", "barah": "12", "twelve": "12",
    "terah": "13", "thirteen": "13", "chaudah": "14", "fourteen": "14",
    "pandrah": "15", "fifteen": "15", "solah": "16", "sixteen": "16",
    "satrah": "17", "seventeen": "17", "atharah": "18", "eighteen": "18",
    "unnis": "19", "nineteen": "19", "bees": "20", "twenty": "20"
}

# Unit normalization
UNIT_MAP = {
    "kilo": "kg", "kilos": "kg", "kilogram": "kg", "kilograms": "kg", "k.g.": "kg", "किलो": "kg", "किलोग्राम": "kg",
    "centimeter": "cm", "centimeters": "cm", "c.m.": "cm", "सेंटीमीटर": "cm"
}

# Common Whisper misspellings or phonetic overlaps
TYPO_MAP = {
    "wait": "weight", "weit": "weight", "wazan": "weight", "vazan": "weight", "वजन": "weight",
    "hi": "height", "haite": "height", "hight": "height", "ऊंचाई": "height", "unchai": "height",
    "dash board": "dashboard", "dashbord": "dashboard",
    "alart": "alert", "alarts": "alerts",
    "repot": "report", "repots": "reports",
    "kholo": "open", "dikhaye": "show", "dikhao": "show",
    "kitne": "how many", "kitna": "how much",
    "case": "cases", "alert": "alerts", "report": "reports"  # Simplify plurals for easier intent matching
}

def normalize_text(text: str) -> str:
    """
    Normalizes transcript text by cleaning punctuation, extra whitespace,
    and mapping common numeric terms and units.
    """
    if not text:
        return ""

    # Convert to lowercase
    text = text.lower()

    # Remove punctuation except decimals
    text = re.sub(r'[^\w\s\.]', '', text)

    # Tokenize
    tokens = text.split()
    normalized_tokens = []

    for token in tokens:
        # Check maps
        if token in NUMBER_MAP:
            normalized_tokens.append(NUMBER_MAP[token])
        elif token in UNIT_MAP:
            normalized_tokens.append(UNIT_MAP[token])
        elif token in TYPO_MAP:
            normalized_tokens.append(TYPO_MAP[token])
        else:
            normalized_tokens.append(token)

    normalized_text = " ".join(normalized_tokens)
    
    # Handle specific multi-word phrases (e.g. "how many" -> "how many", but we did single word mostly)
    # Re-combine numbers like "10 point 5" -> "10.5"
    normalized_text = normalized_text.replace(" point ", ".")
    normalized_text = normalized_text.replace(" dot ", ".")

    return normalized_text.strip()
