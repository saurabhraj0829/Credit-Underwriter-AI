import json
from typing import Any

from backend.ai.llm.groq_client import groq_llm
from backend.ai.rag.rag_service import rag_service


class AICopilotAgent:
    """
    AI Copilot Agent.

    Responsibilities:
    - Answer underwriting-related questions
    - Explain application status
    - Explain risk, fraud, income and compliance results
    - Retrieve relevant underwriting policies
    - Generate evidence-grounded explanations
    """

    name = "AI Copilot Agent"
    version = "1.2"

    def analyze(
        self,
        application: Any,
        question: str,
        underwriting_context: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """
        Process a natural-language underwriting question
        using application context and retrieved policy evidence.
        """

        context = underwriting_context or {}

        # ---------------------------------------------------------
        # RAG Retrieval
        # ---------------------------------------------------------

        rag_result = rag_service.retrieve(
            query=question,
            top_k=5,
        )

        retrieved_evidence = rag_result.get(
            "results",
            []
        )

        evidence_available = rag_result.get(
            "evidence_available",
            False,
        )

        # ---------------------------------------------------------
        # Evidence metadata
        # ---------------------------------------------------------

        evidence_sources = [
            {
                "document_id": evidence["document_id"],
                "category": evidence["category"],
                "source": evidence["source"],
                "chunk_index": evidence["chunk_index"],
                "relevance_score": evidence[
                    "relevance_score"
                ],
            }
            for evidence in retrieved_evidence
        ]

        # ---------------------------------------------------------
        # Grounding Rules
        # ---------------------------------------------------------

        grounding_instruction = """
STRICT GROUNDING RULES:

1. Never invent a policy, regulation, threshold,
   eligibility rule or compliance requirement.

2. If a policy claim is made, it must be supported
   by the retrieved policy evidence.

3. Do not present your own inference as an official
   policy requirement.

4. Clearly distinguish:
   - Application facts
   - Underwriting agent results
   - Retrieved policy evidence
   - Your explanation/inference

5. If policy evidence is unavailable, explicitly say:
   "No relevant policy evidence was retrieved for
   this question."

6. Do not claim that RBI requires something unless
   the retrieved regulatory evidence actually supports it.

7. Never change an underwriting agent result.

8. Never make an autonomous final lending decision.
"""

        if evidence_available:
            evidence_instruction = """
Relevant policy evidence WAS retrieved.

Use it when explaining policy-related claims.
Include the relevant document ID and section/chunk
where useful.
"""
        else:
            evidence_instruction = """
No relevant policy evidence was retrieved.

Do NOT invent or assume a policy rule.
You may explain the application using the supplied
underwriting context, but clearly identify that
policy evidence was not retrieved.
"""

        # ---------------------------------------------------------
        # LLM Prompt
        # ---------------------------------------------------------

        prompt = f"""
You are the AI Copilot for an enterprise loan
underwriting platform.

Your role is to explain underwriting results clearly,
accurately and conservatively.

{grounding_instruction}

{evidence_instruction}

APPLICATION

Application Number:
{application.application_number}

Applicant Name:
{getattr(application, "applicant_name", "Unknown")}

Loan Type:
{getattr(application, "loan_type", "Unknown")}

Loan Amount:
{getattr(application, "loan_amount", "Unknown")}

UNDERWRITING CONTEXT

{json.dumps(context, indent=2, default=str)}

RETRIEVED POLICY EVIDENCE

{json.dumps(
    retrieved_evidence,
    indent=2,
    default=str
)}

USER QUESTION

{question}

RESPONSE FORMAT

Provide:

1. Direct Answer
2. Application / Underwriting Facts
3. Policy Evidence
4. Explanation
5. Next Step, if applicable

Do not create policy evidence that is not present
in the retrieved material.
"""

        try:
            response = groq_llm.invoke(prompt)

            return {
                "agent": self.name,
                "agent_version": self.version,
                "application_id": int(application.id),
                "application_number": str(
                    application.application_number
                ),
                "question": question,
                "answer": response.content,
                "context_available": bool(context),
                "rag_status": rag_result.get(
                    "status"
                ),
                "evidence_available": evidence_available,
                "evidence_count": len(
                    retrieved_evidence
                ),
                "evidence_sources": evidence_sources,
                "relevance_threshold": rag_result.get(
                    "relevance_threshold"
                ),
                "status": "Completed",
                "next_step": (
                    "Policy-Aware Copilot Response"
                ),
            }

        except Exception as exc:
            return {
                "agent": self.name,
                "agent_version": self.version,
                "application_id": int(application.id),
                "application_number": str(
                    application.application_number
                ),
                "question": question,
                "answer": None,
                "context_available": bool(context),
                "rag_status": rag_result.get(
                    "status"
                ),
                "evidence_available": evidence_available,
                "evidence_count": len(
                    retrieved_evidence
                ),
                "evidence_sources": evidence_sources,
                "relevance_threshold": rag_result.get(
                    "relevance_threshold"
                ),
                "status": "Error",
                "error": str(exc),
                "next_step": "Retry LLM Request",
            }


ai_copilot_agent = AICopilotAgent()