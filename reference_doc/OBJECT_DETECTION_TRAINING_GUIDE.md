# 📘 Roboflow Object Detection 학습 가이드

이제 웹캠 실시간 재고 카운트를 위한 Object Detection 모델을 학습합니다.

---

## 🎯 목표

product_list_picture의 60개 이미지 (3개 Q-CODE × 20장)를 사용하여:
- Q1208172 제품 인식
- Q13425723 제품 인식
- Q13527880 제품 인식

웹캠 프레임에서 각 제품의 개수를 자동으로 카운트

---

## 📝 Step 1: Roboflow 프로젝트 생성 (5분)

### 1.1 Roboflow 로그인
https://app.roboflow.com 접속

### 1.2 New Project 생성
1. 우측 상단 **"Create New Project"** 클릭
2. 설정:
   - **Project Name**: `qcode-products`
   - **Project Type**: **Object Detection** 선택
   - **What will your model predict?**: `Products`
   - **License**: `Private` (또는 `Public` 무료)
3. **Create Project** 클릭

---

## 📤 Step 2: 이미지 업로드 (5분)

### 2.1 Upload 페이지 이동
프로젝트 생성 후 자동으로 Upload 페이지로 이동

### 2.2 이미지 선택 및 업로드
1. **"Select Folder"** 또는 **"Browse Files"** 클릭
2. 다음 폴더의 이미지 모두 선택:
   ```
   product_list_picture/Q1208172/ (20장)
   product_list_picture/Q13425723/ (20장)
   product_list_picture/Q13527880/ (20장)
   ```

   **주의**: origin 파일은 제외하고 선택

3. **총 60개 이미지** 선택 확인
4. **"Upload"** 클릭
5. 업로드 완료 대기 (약 1-2분)
6. **"Save and Continue"** 클릭

---

## 🏷️ Step 3: 이미지 라벨링 (30-45분) ⭐ 중요!

### 3.1 Annotate 페이지 이동
좌측 메뉴 **"Annotate"** 클릭

### 3.2 라벨링 방법

**각 이미지마다**:

1. **이미지 클릭하여 열기**

2. **바운딩 박스 그리기**:
   - 제품 주위를 마우스로 드래그하여 박스 생성
   - 제품 전체가 박스 안에 들어가도록

3. **클래스 이름 입력**:
   - 파일 이름에서 Q-CODE 확인
   - 박스 클래스 이름에 Q-CODE 입력

   **예시**:
   ```
   Q1208172_1.png → 클래스 이름: "Q1208172"
   Q1208172_2.png → 클래스 이름: "Q1208172"
   ...
   Q13527880_1.jpg → 클래스 이름: "Q13527880"
   ```

4. **저장 및 다음**:
   - 우측 하단 **"Save"** 클릭
   - 자동으로 다음 이미지로 이동

### 3.3 효율적인 라벨링 팁

1. **키보드 단축키 사용**:
   - 박스 그리기 후 **Enter** 키: 저장
   - **→** 화살표: 다음 이미지
   - **←** 화살표: 이전 이미지

2. **클래스 이름 자동 완성**:
   - 첫 번째 이미지에서 "Q1208172" 입력
   - 이후 이미지에서 클래스 선택할 때 드롭다운에서 선택 가능

3. **폴더별로 라벨링**:
   - Q1208172 폴더 이미지 20장 → 모두 "Q1208172" 클래스
   - Q13425723 폴더 이미지 20장 → 모두 "Q13425723" 클래스
   - Q13527880 폴더 이미지 20장 → 모두 "Q13527880" 클래스

### 3.4 진행 상황 확인
- 상단에 "0/60 images annotated" 표시
- 60개 모두 완료하면 "60/60 images annotated"

---

## 🎲 Step 4: Dataset 생성 (5분)

### 4.1 Generate 페이지 이동
좌측 메뉴 **"Generate"** 클릭

### 4.2 Train/Valid/Test 분할 설정
기본값 사용:
- **Train**: 70% (42 images)
- **Valid**: 20% (12 images)
- **Test**: 10% (6 images)

### 4.3 Augmentation 설정 (선택사항)
권장 Augmentation:
- ✅ **Flip**: Horizontal
- ✅ **Rotation**: ±15°
- ✅ **Brightness**: ±15%
- ✅ **Blur**: Up to 1px

또는 **"Use Recommended"** 클릭

### 4.4 Generate 실행
1. **"Generate"** 버튼 클릭
2. Dataset 생성 대기 (약 1분)
3. **Version 1** 생성 완료 확인

---

## 🚀 Step 5: 모델 학습 (10-20분 자동)

### 5.1 Train 페이지 이동
Dataset 생성 완료 후 **"Train"** 탭 클릭

### 5.2 모델 선택
**YOLOv8** 또는 **YOLOv11** 선택 (권장)

다른 옵션:
- YOLOv8: 빠르고 정확 (권장 ⭐)
- YOLOv11: 최신 모델, 더 높은 정확도
- YOLOv5: 가볍고 빠름

### 5.3 학습 설정
기본값 사용:
- **Epochs**: 100 (자동 조기 종료)
- **Batch Size**: Auto
- **Image Size**: 640x640

### 5.4 학습 시작
1. **"Start Training"** 클릭
2. 학습 대기 (약 10-20분)
   - 진행 상황 실시간 표시
   - 그래프로 Loss/mAP 확인

### 5.5 학습 완료 확인
- **mAP (Mean Average Precision)** 확인
- 권장 mAP: > 80% (우수), > 60% (양호)

---

## 🔗 Step 6: Model ID 확인 및 환경변수 설정 (2분)

### 6.1 Model ID 확인
학습 완료 후:
1. **"Deploy"** 탭 클릭
2. 상단에 Model ID 표시:
   ```
   your-workspace/qcode-products/1
   ```

   **예시**:
   ```
   johndoe/qcode-products/1
   posco-team/qcode-products/1
   ```

### 6.2 .env 파일 업데이트
`backend/.env` 파일 열기:

**수정 전**:
```env
ROBOFLOW_MODEL_ID=  # Object Detection 모델 학습 후 업데이트
```

**수정 후**:
```env
ROBOFLOW_MODEL_ID=your-workspace/qcode-products/1
```

**실제 예시**:
```env
ROBOFLOW_MODEL_ID=johndoe/qcode-products/1
```

### 6.3 백엔드 재시작
백엔드가 자동으로 재시작되지 않으면 수동 재시작

---

## 🧪 Step 7: 테스트 (5분)

### 7.1 웹캠 재고 카운트 테스트

**테스트용 이미지 준비**:
product_list_picture의 이미지 중 하나 사용

**API 호출**:
```bash
curl -X POST http://localhost:8000/api/detect-qcode \
  -F "file=@product_list_picture/Q1208172/Q1208172_5.png"
```

**예상 응답**:
```json
{
  "success": true,
  "message": "1개 제품 감지됨",
  "detected_products": [
    {
      "qcode": "Q1208172",
      "name": "제품 Q1208172",
      "detected_count": 1,
      "confidence": 0.92,
      "quantity_change": +1
    }
  ],
  "total_count": 1,
  "detection_method": "roboflow_yolov8"
}
```

### 7.2 여러 제품 동시 테스트 (선택사항)
여러 제품이 한 화면에 있는 이미지를 직접 촬영하여 테스트

---

## 📊 성능 확인

### 학습 결과 확인 항목:
1. **mAP**: > 60% 이상
2. **Precision**: 높을수록 좋음 (정확하게 제품 감지)
3. **Recall**: 높을수록 좋음 (모든 제품 감지)

### 성능이 낮은 경우:
1. **이미지 추가**: 제품당 30-50장 추가
2. **Augmentation 증가**: 더 다양한 변형 추가
3. **Epoch 증가**: 학습 시간 연장

---

## ⏱️ 총 소요 시간

| 단계 | 소요 시간 |
|------|----------|
| 1. 프로젝트 생성 | 5분 |
| 2. 이미지 업로드 | 5분 |
| 3. 라벨링 (60장) | 30-45분 |
| 4. Dataset 생성 | 5분 |
| 5. 모델 학습 | 10-20분 (자동) |
| 6. 환경변수 설정 | 2분 |
| 7. 테스트 | 5분 |
| **총계** | **약 1-1.5시간** |

---

## 🎯 다음 단계

1. ✅ 제품 DB 등록 완료 (3개 제품)
2. 🚧 Object Detection 학습 (이 가이드 따라하기)
3. 🚧 프론트엔드 연동 테스트
4. 🚧 실제 웹캠으로 실시간 테스트

---

## 💡 추가 팁

### 라벨링 품질 향상:
- 바운딩 박스를 제품에 꽉 맞게 그리기
- 일관된 박스 크기 유지
- 제품이 잘린 경우에도 라벨링

### 학습 데이터 증가:
- 다양한 각도에서 촬영한 이미지 추가
- 다양한 조명 조건의 이미지 추가
- 배경이 다른 이미지 추가

---

**문의사항이 있으시면 언제든지 요청하세요!**
