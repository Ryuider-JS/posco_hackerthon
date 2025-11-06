import boto3
import base64
import uuid

# Bedrock Runtime 클라이언트
bedrock = boto3.client("bedrock-agent-runtime", region_name="ap-northeast-2")

def query_agent(input_text, image_bytes=None):
    # 세션 ID 생성
    session_id = str(uuid.uuid4())

    # 멀티모달 입력: 이미지가 있으면 base64로 텍스트에 포함
    if image_bytes:
        image_b64 = base64.b64encode(image_bytes).decode("utf-8")
        input_text += f"\n[IMAGE:{image_b64}]"

    # invoke_agent 호출
    response = bedrock.invoke_agent(
        agentId="AH6XFHOFZ8",          # Agent ID
        agentAliasId="P4WFEJEBYJ", # Agent Alias ID
        sessionId=session_id,
        inputText=input_text
    )

    # 결과 가져오기
    answer_text = response.get("outputText", "")
    return answer_text

# ===== 사용 예시 =====
if __name__ == "__main__":
    with open("testcan.jpg", "rb") as f:
        image_bytes = f.read()

    question = "이 사진 품목이 무엇인가요?"
    answer = query_agent(question, image_bytes)
    print("Agent 답변:", answer)
