import boto3
import json
import base64
import os

# 환경변수에서 설정 가져오기
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Bedrock Runtime 클라이언트 생성
region = os.getenv("AWS_REGION", "ap-northeast-2")  # 서울 리전
client = boto3.client("bedrock-runtime", region_name=region)

# 로컬 이미지 파일을 base64로 인코딩
image_path = "can.jpg"
# if not os.path.exists(image_path):
    # 대소문자 구분 없이 찾기
    # for filename in ["test.png", "test.PNG", "test.jpg", "test.JPG"]:
    #     if os.path.exists(filename):
    #         image_path = filename
    #         break

if not os.path.exists(image_path):
    print(f"❌ 이미지 파일을 찾을 수 없습니다: test.png")
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
        image_type = "image/png"

# Claude 3.5 Sonnet 멀티모달 요청
payload = {
    "anthropic_version": "bedrock-2023-05-31",
    "max_tokens": 512,
    "messages": [
        {
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
                    "text": "이 사진에서 몇개의 물체가 보이니?"
                }
            ]
        }
    ]
}

try:
    # Claude 3.5 Sonnet 모델 호출
    # Note: 모델 ID는 AWS 계정에 따라 다를 수 있습니다
    response = client.invoke_model(
        modelId="anthropic.claude-3-5-sonnet-20241022-v2:0",
        body=json.dumps(payload),
    )
    
    result = json.loads(response["body"].read())
    print("\n✅ 응답:")
    print(result["content"][0]["text"])
    
except client.exceptions.ValidationException as e:
    error_msg = str(e)
    if "on-demand throughput" in error_msg or "inference profile" in error_msg.lower():
        # Inference profile 사용 필요 - 다른 모델 시도
        print("⚠️  Inference profile이 필요합니다. 다른 모델을 시도합니다...")
        try:
            # Claude 3 Haiku 시도 (일반적으로 더 쉽게 접근 가능)
            response = client.invoke_model(
                modelId="anthropic.claude-3-haiku-20240307-v1:0",
                body=json.dumps(payload),
            )
            result = json.loads(response["body"].read())
            print("\n✅ 응답 (Claude 3 Haiku):")
            print(result["content"][0]["text"])
        except Exception as e2:
            print(f"\n❌ 모델 호출 실패: {e2}")
            print("\n💡 해결 방법:")
            print("   1. AWS Bedrock 콘솔에서 모델 접근 권한 확인")
            print("   2. Inference profile 설정 확인")
            print("   3. 사용 가능한 모델 ID 확인")
    else:
        print(f"\n❌ 모델 ID 오류: {error_msg}")
        print("   사용 가능한 모델 ID를 확인하세요.")
except Exception as e:
    print(f"\n❌ 오류 발생: {e}")
    import traceback
    traceback.print_exc()
