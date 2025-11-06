import os
import uuid
import boto3

REGION = os.getenv("AWS_REGION", "ap-northeast-2")

def invoke_agent(client, agent_id, alias_id, prompt, session_id=None):
    try:
        if session_id is None:
            session_id = str(uuid.uuid4())

        response = client.invoke_agent(
            agentId=agent_id,
            agentAliasId=alias_id,
            sessionId=session_id,
            enableTrace=True,
            inputText=prompt,
            streamingConfigurations={
                "applyGuardrailInterval": 100,
                "streamFinalResponse": False
            }
        )

        completion = ""
        for event in response.get("completion", []):
            if 'chunk' in event:
                chunk = event["chunk"]
                buf = chunk.get("bytes")
                if hasattr(buf, 'read'):
                    buf = buf.read()
                if isinstance(buf, (bytes, bytearray)):
                    completion += buf.decode('utf-8', errors='ignore')
                else:
                    completion += str(buf)

        print("Agent response:")
        print(completion)
        return completion
    except Exception as e:
        print(f"Error invoking agent: {e}")
        return None


if __name__ == "__main__":
    client = boto3.client(service_name="bedrock-agent-runtime", region_name=REGION)
    agent_id = "FVFAR7ILQW"
    alias_id = "GDV3946APK"
    qcode = os.getenv("TEST_QCODE", "Q12345")
    prompt = (
        "재고 부족 알림입니다. 아래 정보를 바탕으로 간단 요약과 조치를 제안해주세요.\n"
        f"- Q-CODE: {qcode}\n"
    )

    print("Testing AWS Bedrock Agent...")
    print(f"Agent ID: {agent_id}")
    print(f"Alias ID: {alias_id}")
    print(f"Prompt: {prompt}")
    print("-" * 50)
    invoke_agent(client, agent_id, alias_id, prompt)


