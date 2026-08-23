import re

with open('backend/app/routers/photo.py', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace the fake result with an HTTPException
target = r'except Exception as e:\s*# If API fails, return demo result\s*print\(f"\[AROMI Photo Check\] OpenRouter API call failed: \{type\(e\)\.__name__\}: \{e\}"\)[\s\S]*?_error_detail": f"\{type\(e\)\.__name__\}: \{str\(e\)\}",\s*\}'
replacement = '''except Exception as e:
        print(f"[AROMI Photo Check] OpenRouter API call failed: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail="Photo analysis failed. Ensure OPENROUTER_API_KEY is valid.")'''

code = re.sub(target, replacement, code)

with open('backend/app/routers/photo.py', 'w', encoding='utf-8') as f:
    f.write(code)
