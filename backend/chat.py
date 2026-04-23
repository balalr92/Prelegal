import json
import os
from typing import Literal, Optional

from dotenv import load_dotenv
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from openai import AsyncOpenAI
from pydantic import BaseModel

load_dotenv()

router = APIRouter()
client = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])

SYSTEM_PROMPT_CHAT = """You are a legal assistant helping the user draft a Mutual Non-Disclosure Agreement (Mutual NDA).

Have a friendly, professional conversation to collect all required information. Ask 1-2 questions at a time — don't overwhelm the user. Explain any legal concepts simply when relevant.

The information you need to collect:
- The two parties: company names, signatory names, titles, and notice addresses (email or postal)
- The purpose of the NDA: how confidential information may be used
- The effective date
- The NDA term: whether it expires after a fixed number of years or continues until terminated
- The confidentiality term: whether obligations last a fixed number of years or in perpetuity
- Governing law (US state) and jurisdiction (courts)
- Any modifications to the standard terms (optional)

Start by greeting the user warmly and asking about the two parties involved."""

SYSTEM_PROMPT_EXTRACT = """Extract NDA field values that have been established in the conversation.

Only include fields explicitly stated or clearly inferrable. Return null for fields not yet determined.

Fields and formats:
- purpose: string describing how confidential information may be used
- effectiveDate: YYYY-MM-DD
- mndaTermType: "expires" or "continuous"
- mndaTermYears: number as string (e.g. "2"), only when mndaTermType is "expires"
- confidentialityTermType: "years" or "perpetuity"
- confidentialityTermYears: number as string, only when confidentialityTermType is "years"
- governingLaw: US state name (e.g. "Delaware")
- jurisdiction: court description (e.g. "courts located in New Castle, DE")
- modifications: any modifications to the standard terms, or null if none
- party1Company: first party company name
- party1Name: first party signatory full name
- party1Title: first party signatory title
- party1NoticeAddress: first party email or postal address for legal notices
- party2Company: second party company name
- party2Name: second party signatory full name
- party2Title: second party signatory title
- party2NoticeAddress: second party email or postal address for legal notices
"""


class NdaFieldsPartial(BaseModel):
    purpose: Optional[str] = None
    effectiveDate: Optional[str] = None
    mndaTermType: Optional[Literal["expires", "continuous"]] = None
    mndaTermYears: Optional[str] = None
    confidentialityTermType: Optional[Literal["years", "perpetuity"]] = None
    confidentialityTermYears: Optional[str] = None
    governingLaw: Optional[str] = None
    jurisdiction: Optional[str] = None
    modifications: Optional[str] = None
    party1Company: Optional[str] = None
    party1Name: Optional[str] = None
    party1Title: Optional[str] = None
    party1NoticeAddress: Optional[str] = None
    party2Company: Optional[str] = None
    party2Name: Optional[str] = None
    party2Title: Optional[str] = None
    party2NoticeAddress: Optional[str] = None


class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: list[Message]


@router.post("/api/chat")
async def chat(req: ChatRequest):
    messages = [{"role": m.role, "content": m.content} for m in req.messages]

    async def stream():
        text_response = ""
        response = await client.chat.completions.create(
            model="gpt-5.4-mini",
            messages=[{"role": "system", "content": SYSTEM_PROMPT_CHAT}] + messages,
            stream=True,
        )
        async for chunk in response:
            if not chunk.choices:
                continue
            content = chunk.choices[0].delta.content
            if content:
                text_response += content
                yield f"data: {json.dumps({'type': 'text', 'content': content})}\n\n"

        extraction = await client.beta.chat.completions.parse(
            model="gpt-5.4-mini",
            messages=(
                [{"role": "system", "content": SYSTEM_PROMPT_EXTRACT}]
                + messages
                + [{"role": "assistant", "content": text_response}]
            ),
            response_format=NdaFieldsPartial,
        )
        fields = extraction.choices[0].message.parsed
        if fields:
            yield f"data: {json.dumps({'type': 'fields', 'data': fields.model_dump(exclude_none=True)})}\n\n"

        yield "data: [DONE]\n\n"

    return StreamingResponse(stream(), media_type="text/event-stream")
