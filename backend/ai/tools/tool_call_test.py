from backend.ai.llm.groq_client import groq_llm
from backend.ai.tools.underwriting_tools import (
    application_details_tool,
    latest_underwriting_decision_tool,
    risk_assessment_tool,
    fraud_assessment_tool,
    compliance_assessment_tool,
    income_verification_tool,
    document_ocr_tool,
    decision_history_tool,
    policy_rag_tool,
)


tools = [
    application_details_tool,
    latest_underwriting_decision_tool,
    risk_assessment_tool,
    fraud_assessment_tool,
    compliance_assessment_tool,
    income_verification_tool,
    document_ocr_tool,
    decision_history_tool,
    policy_rag_tool,
]

tool_map = {
    tool.name: tool
    for tool in tools
}

llm_with_tools = groq_llm.bind_tools(tools)


messages = [
    {
        "role": "user",
        "content": (
            "According to the credit policy, what factors should be considered when assessing an applicant's credit risk?"
        ),
    }
]


# ---------------------------------------------------------
# Step 1: Ask the LLM which tool it needs
# ---------------------------------------------------------

response = llm_with_tools.invoke(messages)

print("FIRST LLM RESPONSE:")
print(response)

print("\nTOOL CALLS:")
print(response.tool_calls)


# ---------------------------------------------------------
# Step 2: Execute the requested tools
# ---------------------------------------------------------

messages.append(response)

for tool_call in response.tool_calls:

    tool_name = tool_call["name"]
    tool_args = tool_call["args"]

    print(
        f"\nEXECUTING TOOL: {tool_name}"
    )

    tool = tool_map.get(tool_name)

    if tool is None:
        raise RuntimeError(
            f"Unknown tool requested: {tool_name}"
        )

    tool_result = tool.invoke(tool_args)

    print("TOOL RESULT:")
    print(tool_result)

    messages.append(
        {
            "role": "tool",
            "content": str(tool_result),
            "tool_call_id": tool_call["id"],
        }
    )


# ---------------------------------------------------------
# Step 3: Give the tool result back to the LLM
# ---------------------------------------------------------

final_response = llm_with_tools.invoke(messages)


print("\nFINAL LLM RESPONSE OBJECT:")
print(final_response)

print("\nFINAL LLM CONTENT:")
print(repr(final_response.content))

print("\nFINAL RESPONSE TOOL CALLS:")
print(final_response.tool_calls)