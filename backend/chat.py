import json
import os
from typing import Literal, Optional

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from openai import AsyncOpenAI
from pydantic import BaseModel

load_dotenv()

router = APIRouter()
client = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])

# ── NDA (existing) ────────────────────────────────────────────────────────────

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


# ── Generic documents ─────────────────────────────────────────────────────────

DOC_CHAT_PROMPTS: dict[str, str] = {
    "csa": """You are a legal assistant helping draft a Cloud Service Agreement (CSA) — a standard SaaS agreement between a Provider and a Customer.

Ask 1-2 questions at a time. Collect:
- Provider: company name, signatory name, title, notice address
- Customer: company name, signatory name, title, notice address
- Effective date
- Subscription period (e.g. "12 months")
- Fees and payment process
- Governing law (US state) and chosen courts
- General liability cap amount
- Claims excluded from the liability cap (unlimitedClaims)
- Provider's indemnification scope (providerCoveredClaims)
- Customer's indemnification scope (customerCoveredClaims)
- Security policy description (optional)

Start by asking about the Provider and Customer.""",

    "design-partner-agreement": """You are a legal assistant helping draft a Design Partner Agreement — for a company giving a partner early access to a product in exchange for feedback.

Ask 1-2 questions at a time. Collect:
- Provider: company name, signatory name, title
- Partner: company name, signatory name, title, notice address
- Name of the design partner program
- Effective date and term (duration)
- Fees (often $0 for early access)
- Governing law (US state) and chosen courts

Start by asking about the Provider and the Partner.""",

    "sla": """You are a legal assistant helping draft a Service Level Agreement (SLA) — covering uptime targets, response times, and service credits.

Ask 1-2 questions at a time. Collect:
- Provider: company name, signatory name, title
- Customer: company name, signatory name, title
- Effective date and subscription period
- Target uptime percentage (e.g. "99.9%")
- Scheduled downtime allowance
- Target response time for support tickets
- Support channel (e.g. "email", "Slack")
- Uptime credit (e.g. "10% of monthly fees per 0.1% below target")
- Response time credit

Start by asking about the Provider and Customer.""",

    "psa": """You are a legal assistant helping draft a Professional Services Agreement (PSA) — for consulting or service delivery engagements.

Ask 1-2 questions at a time. Collect:
- Provider: company name, signatory name, title
- Customer: company name, signatory name, title
- Effective date
- Description of deliverables
- Fees and payment process
- Payment period (e.g. "30 days after invoice")
- Rejection period (days Customer has to reject deliverables)
- Resubmission period (days Provider has to fix rejected deliverables)
- Customer obligations (what Customer must provide)
- Insurance minimums (optional)
- Governing law (US state) and chosen courts
- General liability cap amount

Start by asking about the Provider and Customer.""",

    "dpa": """You are a legal assistant helping draft a Data Processing Agreement (DPA) — a GDPR-compliant agreement governing personal data processing.

Ask 1-2 questions at a time. Collect:
- Provider (data processor): company name, signatory name, title
- Customer (data controller): company name, signatory name, title
- Reference to the parent agreement (e.g. "Cloud Service Agreement dated X")
- Effective date
- Categories of personal data being processed
- Categories of data subjects (e.g. "Customer's end users")
- Whether special category data is involved (sensitive data under GDPR)
- Frequency and nature of data transfers
- Purpose and duration of processing
- List of approved sub-processors
- Governing EU member state for GDPR supervisory authority
- Provider's security contact and security policy

Start by asking about the Provider and the Customer/Controller.""",

    "software-license-agreement": """You are a legal assistant helping draft a Software License Agreement — for on-premise or installable software.

Ask 1-2 questions at a time. Collect:
- Provider: company name, signatory name, title
- Customer (licensee): company name, signatory name, title
- Effective date
- Subscription/license period
- Permitted uses of the software
- License limits (e.g. number of seats or installations)
- Fees and payment process
- Warranty period
- Deletion/return procedure at end of term
- Governing law (US state) and chosen courts
- General liability cap amount
- Claims excluded from cap (unlimitedClaims)
- Provider and Customer indemnification scopes

Start by asking about the Provider and the Customer.""",

    "partnership-agreement": """You are a legal assistant helping draft a Partnership Agreement — for co-marketing or business collaboration.

Ask 1-2 questions at a time. Collect:
- Company (the larger entity): company name, signatory name, title
- Partner: company name, signatory name, title
- Effective date and end date (or term)
- Each party's obligations under the partnership
- Fees or revenue share and payment schedule
- Territory (geographic scope)
- Brand guidelines reference (optional)
- Governing law (US state) and chosen courts
- General liability cap amount

Start by asking about the Company and the Partner.""",

    "pilot-agreement": """You are a legal assistant helping draft a Pilot Agreement — for a time-limited product evaluation or trial.

Ask 1-2 questions at a time. Collect:
- Provider: company name, signatory name, title, notice address
- Customer: company name, signatory name, title, notice address
- Effective date
- Pilot period (duration of the trial, e.g. "90 days")
- Fees (often $0 for a pilot)
- General liability cap amount
- Governing law (US state) and chosen courts

Start by asking about the Provider and the Customer.""",

    "baa": """You are a legal assistant helping draft a Business Associate Agreement (BAA) — for HIPAA-compliant handling of protected health information.

Ask 1-2 questions at a time. Collect:
- Provider (business associate): company name, signatory name, title
- Covered Entity (the healthcare organisation): company name, signatory name, title
- Reference to the parent agreement (e.g. "Cloud Service Agreement dated X")
- Effective date
- Permitted and required uses/disclosures of PHI (limitations)
- Breach notification period (days to notify after discovering a breach, max 60)

Start by asking about the Provider and the Covered Entity.""",

    "ai-addendum": """You are a legal assistant helping draft an AI Addendum — governing AI services usage, model training restrictions, and output ownership. This is an addendum to an existing agreement.

Ask 1-2 questions at a time. Collect:
- Provider (AI service provider): company name, signatory name, title
- Customer: company name, signatory name, title
- Reference to the parent agreement (e.g. "Cloud Service Agreement dated X")
- Effective date
- Description of Customer's data that may be used for training (trainingData)
- Permitted purposes for training (trainingPurposes)
- Restrictions on training use (trainingRestrictions)
- Restrictions on using Customer data to improve the AI service (improvementRestrictions)

Start by asking about the Provider and the Customer.""",
}

GENERIC_EXTRACT_PROMPT = """Extract document key term values that have been established in the conversation.

Only include fields explicitly stated or clearly inferrable. Return null for all other fields.

Field formats:
- effectiveDate: YYYY-MM-DD
- endDate: YYYY-MM-DD or descriptive (e.g. "December 31, 2026")
- All monetary amounts: include currency symbol (e.g. "$50,000")
- All party fields: use full legal name as stated
"""


class GenericDocFields(BaseModel):
    # Parties
    party1Company: Optional[str] = None
    party1Name: Optional[str] = None
    party1Title: Optional[str] = None
    party1NoticeAddress: Optional[str] = None
    party2Company: Optional[str] = None
    party2Name: Optional[str] = None
    party2Title: Optional[str] = None
    party2NoticeAddress: Optional[str] = None
    # Core terms
    effectiveDate: Optional[str] = None
    governingLaw: Optional[str] = None
    chosenCourts: Optional[str] = None
    term: Optional[str] = None
    endDate: Optional[str] = None
    parentAgreement: Optional[str] = None
    # Financial
    fees: Optional[str] = None
    paymentProcess: Optional[str] = None
    paymentSchedule: Optional[str] = None
    paymentPeriod: Optional[str] = None
    # Liability & indemnification
    generalCapAmount: Optional[str] = None
    increasedClaims: Optional[str] = None
    increasedCapAmount: Optional[str] = None
    unlimitedClaims: Optional[str] = None
    providerCoveredClaims: Optional[str] = None
    customerCoveredClaims: Optional[str] = None
    additionalWarranties: Optional[str] = None
    # CSA / Software License
    subscriptionPeriod: Optional[str] = None
    permittedUses: Optional[str] = None
    licenseLimits: Optional[str] = None
    warrantyPeriod: Optional[str] = None
    deletionProcedure: Optional[str] = None
    securityPolicy: Optional[str] = None
    # SLA
    targetUptime: Optional[str] = None
    targetResponseTime: Optional[str] = None
    supportChannel: Optional[str] = None
    uptimeCredit: Optional[str] = None
    responseTimeCredit: Optional[str] = None
    scheduledDowntime: Optional[str] = None
    # PSA
    deliverables: Optional[str] = None
    rejectionPeriod: Optional[str] = None
    resubmissionPeriod: Optional[str] = None
    customerObligations: Optional[str] = None
    insuranceMinimums: Optional[str] = None
    # DPA
    categoriesOfPersonalData: Optional[str] = None
    categoriesOfDataSubjects: Optional[str] = None
    specialCategoryData: Optional[str] = None
    frequencyOfTransfer: Optional[str] = None
    natureAndPurposeOfProcessing: Optional[str] = None
    durationOfProcessing: Optional[str] = None
    approvedSubprocessors: Optional[str] = None
    governingMemberState: Optional[str] = None
    # BAA
    limitations: Optional[str] = None
    breachNotificationPeriod: Optional[str] = None
    # Partnership
    party1Obligations: Optional[str] = None
    party2Obligations: Optional[str] = None
    territory: Optional[str] = None
    brandGuidelines: Optional[str] = None
    # Design Partner
    programName: Optional[str] = None
    # AI Addendum
    trainingData: Optional[str] = None
    trainingPurposes: Optional[str] = None
    trainingRestrictions: Optional[str] = None
    improvementRestrictions: Optional[str] = None


# ── Help chat ─────────────────────────────────────────────────────────────────

HELP_CHAT_PROMPT = """You are a legal assistant helping the user find the right legal document for their needs.

The following documents are available:
- mutual-nda: Mutual Non-Disclosure Agreement — mutual confidentiality between two parties
- csa: Cloud Service Agreement — SaaS provider/customer agreement
- design-partner-agreement: Design Partner Agreement — early product access and feedback
- sla: Service Level Agreement — uptime targets, response times, and service credits
- psa: Professional Services Agreement — consulting and service delivery
- dpa: Data Processing Agreement — GDPR-compliant personal data processing
- software-license-agreement: Software License Agreement — on-premise software licensing
- partnership-agreement: Partnership Agreement — co-marketing and business collaboration
- pilot-agreement: Pilot Agreement — limited-time product evaluation
- baa: Business Associate Agreement — HIPAA-compliant protected health information
- ai-addendum: AI Addendum — AI services usage and model training restrictions

If the user describes a need that matches one of these, confirm the match and suggest they proceed.
If they ask for something not on the list (e.g. employment contract, will, equity agreement), explain politely that it is not currently supported and suggest the closest available document.

Start by asking what kind of legal document the user needs."""

HELP_EXTRACT_PROMPT = """Based on the conversation, identify which document the user needs.

If a specific supported document has been agreed upon, return its exact slug (e.g. "mutual-nda", "csa").
If no document has been confirmed yet, return null for suggested_doc."""


class HelpFields(BaseModel):
    suggested_doc: Optional[str] = None


# ── Request / response models ─────────────────────────────────────────────────

class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: list[Message]
    doc_type: str = "mutual-nda"


# ── Endpoint ──────────────────────────────────────────────────────────────────

@router.post("/api/chat")
async def chat(req: ChatRequest):
    messages = [{"role": m.role, "content": m.content} for m in req.messages]
    doc_type = req.doc_type

    if doc_type == "mutual-nda":
        chat_prompt = SYSTEM_PROMPT_CHAT
        extract_prompt = SYSTEM_PROMPT_EXTRACT
        extraction_model = NdaFieldsPartial
    elif doc_type == "help":
        chat_prompt = HELP_CHAT_PROMPT
        extract_prompt = HELP_EXTRACT_PROMPT
        extraction_model = HelpFields
    else:
        if doc_type not in DOC_CHAT_PROMPTS:
            raise HTTPException(status_code=422, detail=f"Unknown doc_type: {doc_type}")
        chat_prompt = DOC_CHAT_PROMPTS[doc_type]
        extract_prompt = GENERIC_EXTRACT_PROMPT
        extraction_model = GenericDocFields

    async def stream():
        text_response = ""
        response = await client.chat.completions.create(
            model="gpt-5.4-mini",
            messages=[{"role": "system", "content": chat_prompt}] + messages,
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
                [{"role": "system", "content": extract_prompt}]
                + messages
                + [{"role": "assistant", "content": text_response}]
            ),
            response_format=extraction_model,
        )
        fields = extraction.choices[0].message.parsed
        if fields:
            yield f"data: {json.dumps({'type': 'fields', 'data': fields.model_dump(exclude_none=True)})}\n\n"

        yield "data: [DONE]\n\n"

    return StreamingResponse(stream(), media_type="text/event-stream")
