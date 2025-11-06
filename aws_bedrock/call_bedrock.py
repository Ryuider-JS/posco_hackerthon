"""
Bedrock Agent에 이미지 전송 및 대화
config.py의 설정을 사용하여 Bedrock Agent에 연결하고 can.jpg를 전송합니다.
"""
import boto3
import json
import base64
import os
import uuid
from config import AWSConfig

# 환경변수에서 설정 가져오기
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Bedrock Agent Runtime 클라이언트 생성
region = os.getenv("AWS_REGION", "ap-northeast-2")  # 서울 리전
client = boto3.client("bedrock-agent-runtime", region_name=region)

# 로컬 이미지 파일을 base64로 인코딩
image_path = "testcan.jpg"

if not os.path.exists(image_path):
    print(f"❌ 이미지 파일을 찾을 수 없습니다: {image_path}")
    exit(1)

# 이미지를 base64로 인코딩
with open(image_path, "rb") as image_file:
    image_base64 = base64.b64encode(image_file.read()).decode('utf-8')
    
    # 이미지 타입 감지
    if image_path.lower().endswith('.png'):
        image_type = "image/png"
    elif image_path.lower().endswith('.jpg') or image_path.lower().endswith('.jpeg'):
        image_type = "image/jpeg"
    else:
        image_type = "image/jpeg"

print(f"📸 이미지 로드 완료: {image_path}")
print(f"   타입: {image_type}")
print(f"   크기: {len(image_base64)} bytes (base64)")
print()

# Bedrock Agent 연결 및 메시지 전송
print("🔗 Bedrock Agent 연결 중...")
try:
    print(f"   Agent ID: {AWSConfig.agent_id}")
    print(f"   Alias ID: {AWSConfig.alias_id}")
    print()

    # 세션 ID 생성 (새 세션)
    session_id = str(uuid.uuid4())
    print(f"   Session ID: {session_id}")
    print()

    # 멀티모달 메시지 구성 (multi_modal.py와 동일한 형식)
    # Bedrock Agent는 AWS Bedrock 메시지 형식을 사용
    message_content = {
        "role": "user",
        "content": [
            {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": image_type,
                    "data": image_base64
                }
            },
            {
                "type": "text",
                "text": "이 제품과 가장 유사한 제품을 찾아서 파일명을 알려줘"
            }
        ]
    }
    
    # inputText로 전송 (JSON 문자열)
    input_text = json.dumps(message_content, ensure_ascii=False)
    
    print("📤 이미지와 메시지 전송 중...")
    
    # Agent 호출
    response = client.invoke_agent(
        agentId=AWSConfig.agent_id,
        agentAliasId=AWSConfig.alias_id,
        sessionId=session_id,
        inputText=input_text,
        enableTrace=False
    )
    
    print("✅ 메시지 전송 완료")
    print()
    print("📥 Agent 응답:")
    print("-" * 50)
    
    # 스트리밍 응답 처리
    event_stream = response.get('completion')
    full_response = ""
    response_session_id = response.get('sessionId', '')
    
    if response_session_id:
        print(f"   Session ID: {response_session_id}")
    
    if event_stream:
        try:
            for event in event_stream:
                if 'chunk' in event:
                    chunk = event['chunk']
                    if 'bytes' in chunk:
                        # 응답 데이터 파싱
                        try:
                            chunk_data = json.loads(chunk['bytes'].decode('utf-8'))
                            if isinstance(chunk_data, dict):
                                if 'text' in chunk_data:
                                    text = chunk_data['text']
                                    print(text, end='', flush=True)
                                    full_response += text
                                elif 'content' in chunk_data:
                                    # 다른 형식의 응답 처리
                                    content = chunk_data['content']
                                    if isinstance(content, list) and len(content) > 0:
                                        if 'text' in content[0]:
                                            text = content[0]['text']
                                            print(text, end='', flush=True)
                                            full_response += text
                                    else:
                                        print(json.dumps(chunk_data, ensure_ascii=False, indent=2))
                            else:
                                print(str(chunk_data), end='', flush=True)
                                full_response += str(chunk_data)
                        except (json.JSONDecodeError, UnicodeDecodeError) as e:
                            # 바이너리 데이터인 경우 직접 출력 시도
                            try:
                                text = chunk['bytes'].decode('utf-8')
                                print(text, end='', flush=True)
                                full_response += text
                            except:
                                pass
                    elif 'text' in chunk:
                        # 직접 텍스트 응답
                        text = chunk['text']
                        print(text, end='', flush=True)
                        full_response += text
                elif 'returnControl' in event:
                    # 제어 반환 이벤트
                    print("\n[제어 반환 이벤트]")
                    print(json.dumps(event['returnControl'], ensure_ascii=False, indent=2))
                elif 'trace' in event:
                    # 추적 이벤트 (enableTrace=True일 때)
                    pass
            
            print()
            print("-" * 50)
            if full_response:
                print(f"\n✅ 응답 완료")
            else:
                print(f"\n⚠️  응답이 비어있습니다")
        except Exception as stream_error:
            print(f"\n❌ 스트리밍 응답 처리 중 오류: {stream_error}")
            import traceback
            traceback.print_exc()
    
except client.exceptions.ValidationException as e:
    print(f"❌ 검증 오류: {e}")
    print("\n💡 해결 방법:")
    print("   1. Agent ID와 Alias ID가 올바른지 확인")
    print("   2. Agent가 활성화되어 있는지 확인")
    print("   3. Agent에 필요한 권한이 있는지 확인")
except client.exceptions.AccessDeniedException as e:
    print(f"❌ 접근 거부: {e}")
    print("\n💡 해결 방법:")
    print("   1. AWS 자격 증명 확인")
    print("   2. Agent 접근 권한 확인")
except Exception as e:
    print(f"❌ 오류 발생: {e}")
    import traceback
    traceback.print_exc()
