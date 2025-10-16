from google import genai
from dotenv import load_dotenv
import os

# test.py から見て 1階層上の .env.local を読み込む
load_dotenv("../../.env.local")

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY が読み込まれていません。")

print("✅ GEMINI_API_KEY detected:", api_key[:8] + "...")

client = genai.Client()

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="Explain how AI works in a few words"
)

print("\n🧠 Gemini response:")
print(response.text)
