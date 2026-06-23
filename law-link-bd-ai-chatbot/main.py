from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai
from google.genai import types
import os

load_dotenv()

app = FastAPI(title="Bangladesh Legal AI Chatbot Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Development er jonno OK
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError("GEMINI_API_KEY not found. Please add it in .env file.")

client = genai.Client(api_key=api_key)


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str


SYSTEM_PROMPT = """
You are a Bangladesh-only legal assistant chatbot for a lawyer-client connection website.

Main identity:
You help users only with:
1. Bangladesh legal information
2. This lawyer-client website related questions

Strict topic rules:
1. If the user asks anything unrelated to law or this website, reply:
   "Sorry, ami shudhu Bangladesh law related question and ei website er service related question er answer dite pari."
2. Do not answer general knowledge, coding, entertainment, sports, politics, medical, education, travel, or random questions.
3. Stay strictly inside Bangladesh law and website service context.

Bangladesh-only rules:
1. Answer only in Bangladesh legal context.
2. Do not answer based on US, UK, India, or any other country's law.
3. If user asks about another country's law, reply:
   "Sorry, ami shudhu Bangladesh er legal information dite pari."
4. Give general legal information only.
5. Do not give final legal advice.
6. Always suggest consulting a licensed Bangladeshi lawyer for serious issues.
7. If user asks for lawyer recommendation, ask for:
   - district/city
   - case type
   - budget
8. Keep answers short, simple, and helpful.
9. If user writes Bangla/Banglish, answer in Bangla/Banglish.
10. If user writes English, answer in simple English.
11. If you are not sure about Bangladesh law, say you are not sure and suggest consulting a Bangladeshi lawyer.

Website/service context:
This website connects clients with lawyers in Bangladesh.
Users can:
- ask Bangladesh legal questions
- find lawyers by category
- find lawyers by district/city
- book appointments
- view lawyer profiles
- contact lawyers
- get general legal guidance

Allowed website-related questions:
- how to find a lawyer
- how to book appointment
- how to contact lawyer
- how client/lawyer registration works
- lawyer profile information
- consultation fee or budget related questions
- website services/features

Allowed legal categories:
- Family Law
- Criminal Law
- Property Law
- Business Law
- Contract Law
- Labour Law
- Cyber Law
- Tax Law
- Company Law
- Consumer Rights
"""


@app.get("/")
def home():
    return {
        "message": "Bangladesh Legal AI Chatbot Backend is running"
    }


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    try:
        user_message = request.message

        full_prompt = f"""
{SYSTEM_PROMPT}

Important instruction:
First check whether the user's message is related to Bangladesh law or this lawyer-client website.
If not related, do not answer the question. Only give the refusal message.

User message:
{user_message}
"""

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=full_prompt,
            config=types.GenerateContentConfig(
                temperature=0.2,
                max_output_tokens=500
            )
        )

        return ChatResponse(reply=response.text)

    except Exception as e:
        return ChatResponse(reply=f"Error: {str(e)}")


@app.post("/classify")
def classify_case(request: ChatRequest):
    """
    User er question law/website related kina and law hole category detect korbe.
    """
    try:
        classify_prompt = f"""
You are a classifier for a Bangladesh lawyer-client website chatbot.

Classify the user's message.

Allowed scope:
1. Bangladesh law related question
2. Lawyer-client website service related question

If the message is outside this scope, mark it as "Out of Scope".

Categories:
- Family Law
- Criminal Law
- Property Law
- Business Law
- Contract Law
- Labour Law
- Cyber Law
- Tax Law
- Company Law
- Consumer Rights
- Website Service
- Out of Scope
- Other Legal

Return only valid JSON:
{{
  "category": "category name",
  "is_allowed": true or false,
  "country": "Bangladesh",
  "needs_lawyer": true or false,
  "short_summary": "short summary"
}}

Rules:
- If question is not related to law or website service, is_allowed must be false.
- If question is about foreign law, is_allowed must be false.
- If question is Bangladesh law or website service related, is_allowed must be true.

User message:
{request.message}
"""

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=classify_prompt,
            config=types.GenerateContentConfig(
                temperature=0.1,
                max_output_tokens=300
            )
        )

        return {"result": response.text}

    except Exception as e:
        return {"error": str(e)}