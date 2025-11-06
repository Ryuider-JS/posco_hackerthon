완벽해요! **Roboflow 공식 샘플 코드**를 찾았습니다! 🎉

---

## 🎯 가장 유용한 Roboflow GitHub 리포지토리

### 1️⃣ **roboflow/notebooks** ⭐ (강력 추천!)

**링크:** https://github.com/roboflow/notebooks

최신 컴퓨터 비전 모델과 기법에 대한 튜토리얼 모음입니다. YOLO11, SAM 2, Florence-2 등 다양한 모델 사용법이 포함되어 있습니다.

**특징:**

* Colab, Kaggle에서 바로 실행 가능
* 단계별 튜토리얼
* 최신 모델들 예제 포함

```bash
git clone https://github.com/roboflow/notebooks.git
cd notebooks
```

---

### 2️⃣ **roboflow/roboflow-python** ⭐⭐

**링크:** https://github.com/roboflow/roboflow-python

공식 Roboflow Python 패키지로, 데이터셋, 모델, 배포를 관리할 수 있습니다.

**추론 예제:**

```python
import roboflow

roboflow.login()
rf = roboflow.Roboflow()

workspace = rf.workspace("WORKSPACE_URL")
project = workspace.project("PROJECT_URL")
version = project.version("VERSION_NUMBER")

# 추론 실행
model = version.model
predictions = model.predict("image.jpg")
print(predictions)
```

---

### 3️⃣ **roboflow/cookbooks** 🍳

**링크:** https://github.com/roboflow/cookbooks

Roboflow 블로그 게시물에서 참조되는 컴퓨터 비전 프로젝트 템플릿과 예제가 있습니다.

---

### 4️⃣ **roboflow/roboflow-computer-vision-utilities** 🛠️

**링크:** https://github.com/roboflow/roboflow-computer-vision-utilities

Roboflow API와 Python 패키지를 사용하여 추론을 실행하고 결과 이미지를 커스터마이징하는 방법을 보여줍니다.

**기능:**

* 이미지 업로드
* 비디오 프레임 추출
* 두 단계 추론 (예: 얼굴 탐지 → 분류)

---

### 5️⃣ **roboflow/supervision** 👀

**링크:** https://github.com/roboflow/supervision

재사용 가능한 컴퓨터 비전 도구 라이브러리

* 객체 추적
* 비디오 분석
* 시각화 도구

---

## 🔥 귀하의 해커톤에 딱 맞는 예제

### **간단한 추론 예제 (roboflow-python)**

```python
from roboflow import Roboflow

# 초기화
rf = Roboflow(api_key="YOUR_API_KEY")
project = rf.workspace("2025-hackerthon").project("hackerthon2025")
model = project.version(2).model

# 추론 실행
result = model.predict("test_image.jpg", confidence=40, overlap=30)

# 결과 확인
print(result.json())

# 결과를 이미지로 저장
result.save("output.jpg")
```

---

## 📦 설치 및 빠른 시작

```bash
# 1. 공식 Python 패키지 설치
pip install roboflow

# 2. notebooks 리포지토리 클론
git clone https://github.com/roboflow/notebooks.git
cd notebooks

# 3. 예제 실행
jupyter notebook
```

---

## 🎯 바로 사용 가능한 코드 (통합 버전)

```python
from roboflow import Roboflow

def detect_tangerine_roboflow_sdk(image_path, api_key):
    """
    Roboflow SDK로 귤 탐지 (가장 간단한 방법)
    """
    try:
        # Roboflow 초기화
        rf = Roboflow(api_key=api_key)
      
        # 프로젝트와 모델 가져오기
        project = rf.workspace("2025-hackerthon").project("hackerthon2025")
        model = project.version(2).model
      
        # 추론 실행
        prediction = model.predict(image_path, confidence=40, overlap=30)
      
        return {
            "success": True,
            "predictions": prediction.json()['predictions'],
            "count": len(prediction.json()['predictions'])
        }
  
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


# 사용
api_key = "YOUR_ROBOFLOW_API_KEY"
result = detect_tangerine_roboflow_sdk("test.jpg", api_key)
print(result)
```

---

## 💡 추천 순서

1. **roboflow-python 설치** → 가장 간단함
2. **notebooks 리포지토리** → 튜토리얼 참고
3. **cookbooks** → 실전 프로젝트 예제

---

**이 중에서 `roboflow-python` 패키지를 사용하는 게 가장 간단합니다!**

위의 코드를 복사해서 API 키만 교체하면 바로 작동할 거예요! 🚀
