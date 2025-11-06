"""
S3에 이미지 업로드 스크립트
test.png 파일을 S3에 업로드합니다.
"""
import os
from s3_uploader import S3Uploader

# .env 파일 로드 (있는 경우)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# 설정
BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "posco-bedrock-vector-s3-12jo")
S3_FOLDER = os.getenv("S3_FOLDER", "wx_hackerton/product_pic")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")

def upload_image():
    """test.png 파일을 S3에 업로드"""
    
    # 업로드할 파일 경로 (대소문자 구분 없이 찾기)
    file_path = None
    for filename in ["test.png", "test.PNG", "test.jpg", "test.JPG"]:
        if os.path.exists(filename):
            file_path = filename
            break
    
    if not file_path:
        print(f"❌ test.png 파일을 찾을 수 없습니다.")
        print(f"   프로젝트 폴더에 test.png 파일을 준비해주세요.")
        return
    
    # 업로더 초기화
    uploader = S3Uploader(
        bucket_name=BUCKET_NAME,
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY
    )
    
    # 파일명 생성 (타임스탬프 추가)
    from datetime import datetime
    filename = os.path.basename(file_path)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    file_extension = os.path.splitext(filename)[1]
    unique_filename = f"{timestamp}_{filename}"
    
    # S3 키 생성
    s3_key = f"{S3_FOLDER}/{unique_filename}"
    
    print(f"업로드 시작...")
    print(f"  파일: {file_path}")
    print(f"  버킷: {BUCKET_NAME}")
    print(f"  폴더: {S3_FOLDER}")
    print(f"  S3 경로: {s3_key}")
    print()
    
    # 파일 업로드
    result = uploader.upload_file(
        file_path=file_path,
        s3_key=s3_key,
        public_read=True
    )
    
    if result['success']:
        print("✅ 업로드 성공!")
        print(f"  URL: {result['file_url']}")
        print(f"  S3 경로: {result['s3_key']}")
    else:
        print(f"❌ 업로드 실패: {result.get('error', '알 수 없는 오류')}")


if __name__ == "__main__":
    # 환경변수 확인
    if not AWS_ACCESS_KEY_ID or not AWS_SECRET_ACCESS_KEY:
        print("⚠️  경고: AWS 자격 증명이 설정되지 않았습니다!")
        print("   환경변수를 설정하거나 .env 파일을 확인하세요.")
        print()
    
    upload_image()
