# Vision API Product Search vs Gemini 비교

## 현재 구현 상태

백엔드는 **두 가지 방식 모두 지원**하며, Vision API를 우선 사용하고 실패 시 Gemini로 자동 fallback합니다.

## 방식 1: Google Vision API Product Search (권장)

### 장점
- ⚡ **매우 빠름**: 인덱싱된 DB에서 검색 (ms 단위)
- 🎯 **정확도 높음**: Google의 강력한 시각적 검색 알고리즘
- 📈 **확장성**: 수만 개 제품도 빠르게 처리
- 💰 **비용 효율적**: 월 1,000개 무료, 이후 $5/1,000개

### 단점
- 🔧 **초기 설정 복잡**: Google Cloud 프로젝트, 서비스 계정, GCS 버킷 필요
- 📝 **관리 필요**: Product Set 생성 및 관리

### 설정 방법
1. Google Cloud 프로젝트 생성
2. Vision API 활성화
3. 서비스 계정 생성 및 JSON 키 다운로드
4. Cloud Storage 버킷 생성
5. Product Set 생성 (`python setup_vision_api.py`)
6. `.env` 파일 설정

자세한 내용: [VISION_API_SETUP.md](backend/VISION_API_SETUP.md)

### 작동 방식
```
제품 등록 시:
1. 이미지를 Google Cloud Storage에 업로드
2. Vision API에 제품 등록 (메타데이터 포함)
3. Product Set에 추가
4. Google이 자동으로 인덱싱

검색 시:
1. 쿼리 이미지를 Vision API에 전송
2. 인덱스에서 시각적으로 유사한 제품 검색
3. 유사도 점수와 함께 결과 반환 (즉시)
```

## 방식 2: Google Gemini Vision (Fallback)

### 장점
- 🚀 **설정 간단**: API 키만 있으면 됨
- 💪 **강력한 AI**: Gemini 1.5 Flash 모델
- 🔄 **유연성**: 즉시 테스트 가능

### 단점
- 🐌 **느림**: 제품마다 개별 비교 필요 (제품 N개 = N번 API 호출)
- 💸 **비용 높음**: 제품이 많을수록 API 호출 증가
- ⏱️ **응답 시간**: 제품 100개면 수십 초 소요 가능

### 설정 방법
1. Gemini API 키 발급
2. `.env`에 `GEMINI_API_KEY` 설정
3. 완료!

### 작동 방식
```
제품 등록 시:
1. 로컬에 이미지 저장

검색 시:
1. DB의 모든 제품 이미지와 쿼리 이미지 비교 (루프)
2. Gemini API로 각 이미지 쌍 비교
3. 유사도 점수 계산
4. 정렬하여 상위 결과 반환
```

## 성능 비교

| 항목 | Vision API Product Search | Gemini Vision |
|------|--------------------------|---------------|
| **검색 속도** | ~100ms | ~5s (제품 10개 기준) |
| **제품 100개** | ~100ms | ~50s |
| **제품 1000개** | ~100ms | ~8분 |
| **초기 설정** | 복잡 (1-2시간) | 간단 (5분) |
| **월 비용 (1000회 검색, 100개 제품)** | $5-10 | $50-100 |
| **정확도** | 매우 높음 | 높음 |

## 현재 코드 동작

[backend/app/routes/products.py](backend/app/routes/products.py:68-116)에서:

```python
# Vision API 먼저 시도
vision_results = search_similar_products_vision(file_path)

if vision_results["success"]:
    # Vision API 사용
    return {"similarity_method": "google_vision_product_search"}
else:
    # Gemini fallback
    return {"similarity_method": "gemini_fallback"}
```

## 권장 사항

### POC/데모용 (현재 상황)
- **Gemini 사용** (현재 설정되어 있음)
- 제품 수가 적고 (<20개)
- 빠른 테스트가 필요한 경우

### 프로덕션용
- **Vision API Product Search 사용**
- 제품 수가 많고 (>20개)
- 실시간 성능이 중요한 경우
- 장기적인 운영 계획

## 전환 방법

### Gemini → Vision API로 전환
1. `VISION_API_SETUP.md` 가이드 따라 설정
2. `python setup_vision_api.py` 실행
3. 서버 재시작 → 자동으로 Vision API 사용

### Vision API → Gemini로 전환
1. `.env`에서 Vision API 환경 변수 제거/주석
2. 서버 재시작 → 자동으로 Gemini fallback 사용

## 비용 계산기

### Vision API
- 무료: 월 1,000개 이미지
- 이후: $5/1,000개 이미지
- Storage: $0.02/GB/month

예) 월 10,000회 검색, 100개 제품 등록:
- Vision API: $45
- Storage: ~$0.10
- **총 ~$45/월**

### Gemini
- 입력: 1,000 토큰당 $0.075
- 출력: 1,000 토큰당 $0.30
- 이미지 1개 = ~2,000 토큰

예) 월 10,000회 검색, 제품당 100개 비교:
- API 호출: 10,000 × 100 = 1,000,000회
- **총 ~$300-500/월**

## 결론

| 상황 | 권장 방식 |
|------|----------|
| **해커톤/POC** | Gemini (간단) |
| **소규모 (<50개 제품)** | Gemini |
| **중규모 (50-500개 제품)** | Vision API |
| **대규모 (500개+ 제품)** | Vision API (필수) |
| **실시간 요구사항** | Vision API |
| **빠른 프로토타입** | Gemini |

**현재 프로젝트 (POSCO 해커톤)**:
- ✅ Gemini로 시작 (이미 작동 중)
- 필요 시 Vision API로 업그레이드 가능 (코드 준비됨)
