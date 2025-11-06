# S3 이미지 업로드

`test.png` 파일을 AWS S3에 업로드하는 간단한 스크립트입니다.

## 설치

```bash
pip install -r requirements.txt
```

## AWS 환경변수 설정

PowerShell에서 다음 명령어 실행:

```powershell
$env:S3_BUCKET_NAME="posco-bedrock-vector-s3-12jo"
$env:S3_FOLDER="wx_hackerton/product_pic"
$env:AWS_ACCESS_KEY_ID="your-access-key-id"
$env:AWS_SECRET_ACCESS_KEY="your-secret-access-key"
```

또는 `.env` 파일 생성:

```
S3_BUCKET_NAME=posco-bedrock-vector-s3-12jo
S3_FOLDER=wx_hackerton/product_pic
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
```

## 사용 방법

1. `test.png` 파일을 프로젝트 폴더에 준비
2. 스크립트 실행:

```bash
python upload_image.py
```

## 파일 구조

- `s3_uploader.py` - S3 업로드 클래스
- `upload_image.py` - test.png 업로드 스크립트
- `test.png` - 업로드할 이미지 파일