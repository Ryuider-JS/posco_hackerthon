"""
Roboflow 서비스
- CLIP 기반 이미지 유사도 검색
- Object Detection 기반 재고 카운트
"""
import os
import numpy as np
import requests
import base64
from typing import List, Dict, Optional
from dotenv import load_dotenv

load_dotenv()

ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY")
ROBOFLOW_MODEL_ID = os.getenv("ROBOFLOW_MODEL_ID", "")  # Object Detection 모델 ID

# Roboflow API 엔드포인트
CLIP_EMBED_URL = "https://infer.roboflow.com/clip/embed_image"
CLIP_COMPARE_URL = "https://infer.roboflow.com/clip/compare"
INFERENCE_URL = "https://detect.roboflow.com"


def encode_image_to_base64(image_path: str) -> str:
    """
    이미지를 Base64로 인코딩
    """
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")


def get_clip_embedding(image_path: str) -> np.ndarray:
    """
    Roboflow CLIP API로 이미지 임베딩 생성

    Args:
        image_path: 이미지 파일 경로

    Returns:
        numpy array: CLIP 임베딩 벡터
    """
    try:
        # API 키 확인
        if not ROBOFLOW_API_KEY:
            raise Exception("ROBOFLOW_API_KEY not set in environment")

        print(f"    Using API key: {ROBOFLOW_API_KEY[:10]}...")

        # 이미지를 base64로 인코딩
        image_base64 = encode_image_to_base64(image_path)
        print(f"    Image encoded (base64 length: {len(image_base64)} chars)")

        # JSON 페이로드 구성
        payload = {
            "image": {
                "type": "base64",
                "value": image_base64
            }
        }

        # API 요청
        print(f"    Sending request to: {CLIP_EMBED_URL}")
        response = requests.post(
            CLIP_EMBED_URL,
            params={"api_key": ROBOFLOW_API_KEY},
            json=payload
        )

        print(f"    Response status: {response.status_code}")
        print(f"    Response body: {response.text[:200]}...")

        if response.status_code != 200:
            raise Exception(f"CLIP API error: {response.status_code} - {response.text}")

        result = response.json()

        # 임베딩 추출
        if "embeddings" in result:
            return np.array(result["embeddings"][0])  # 첫 번째 임베딩
        else:
            raise Exception(f"No embeddings in response: {result}")

    except Exception as e:
        print(f"[ERROR] get_clip_embedding: {e}")
        raise


def cosine_similarity(vec1: np.ndarray, vec2: np.ndarray) -> float:
    """
    두 벡터 간 코사인 유사도 계산

    Args:
        vec1: 첫 번째 벡터
        vec2: 두 번째 벡터

    Returns:
        float: 코사인 유사도 (0~1)
    """
    dot_product = np.dot(vec1, vec2)
    norm1 = np.linalg.norm(vec1)
    norm2 = np.linalg.norm(vec2)

    if norm1 == 0 or norm2 == 0:
        return 0.0

    return float(dot_product / (norm1 * norm2))


def convert_to_relative_path(image_path: str) -> str:
    """
    절대 경로를 프론트엔드용 상대 URL로 변환

    Args:
        image_path: 절대 경로

    Returns:
        str: 상대 URL 경로
    """
    if not image_path:
        return image_path

    # Convert Windows backslashes to forward slashes
    image_url = image_path.replace("\\", "/")

    # Extract path after "product_list_picture/"
    if "product_list_picture/" in image_url:
        relative_path = image_url.split("product_list_picture/")[1]
        return f"product_list_picture/{relative_path}"
    # Extract path after "uploads/"
    elif "uploads/" in image_url:
        relative_path = image_url.split("uploads/")[1]
        return f"uploads/{relative_path}"

    return image_url


def search_similar_products_roboflow(
    query_image_path: str,
    existing_products: List[Dict],
    top_k: int = 5
) -> Dict:
    """
    Roboflow CLIP으로 유사 제품 검색

    Args:
        query_image_path: 신규 업로드 이미지 경로
        existing_products: DB의 기존 제품 리스트 (dict 형태)
        top_k: 반환할 상위 N개

    Returns:
        {
            "success": True/False,
            "similar_products": [...],
            "error": "..." (실패 시)
        }
    """
    try:
        print(f"[*] Roboflow CLIP: Generating embedding for query image...")

        # 1. 신규 이미지 임베딩 생성
        query_embedding = get_clip_embedding(query_image_path)
        print(f"    Query embedding shape: {query_embedding.shape}")

        # 2. 각 기존 제품과 유사도 계산
        similarities = []

        for idx, product in enumerate(existing_products):
            # 제품 이미지가 없으면 스킵
            if not product.get("image_path"):
                continue

            product_image_path = product["image_path"]
            print(f"    [DEBUG] Checking {product.get('qcode', 'unknown')}: {product_image_path}")

            if not os.path.exists(product_image_path):
                print(f"    [SKIP] Product {product.get('qcode', 'unknown')}: image not found at {product_image_path}")
                continue

            try:
                # 제품 이미지 임베딩 생성
                product_embedding = get_clip_embedding(product["image_path"])

                # 코사인 유사도 계산
                similarity = cosine_similarity(query_embedding, product_embedding)

                # 제품 정보에 유사도 추가
                product_with_score = product.copy()
                product_with_score["similarity"] = float(similarity * 100)  # 퍼센트로 변환
                product_with_score["visual_similarity"] = float(similarity * 100)
                product_with_score["text_similarity"] = 0

                similarities.append(product_with_score)

                print(f"    [{idx+1}/{len(existing_products)}] {product.get('qcode', 'unknown')}: {similarity*100:.1f}%")

            except Exception as e:
                print(f"    [ERROR] Processing product {product.get('qcode', 'unknown')}: {e}")
                continue

        # 3. 유사도 높은 순 정렬
        similarities.sort(key=lambda x: x["similarity"], reverse=True)

        # 4. 이미지 경로를 프론트엔드용 상대 경로로 변환
        for product in similarities[:top_k]:
            if product.get("image_path"):
                product["image_path"] = convert_to_relative_path(product["image_path"])

        print(f"[OK] Found {len(similarities)} similar products")

        return {
            "success": True,
            "similar_products": similarities[:top_k]
        }

    except Exception as e:
        print(f"[ERROR] search_similar_products_roboflow: {e}")
        return {
            "success": False,
            "error": str(e),
            "similar_products": []
        }


def detect_products_in_frame(image_path: str) -> Dict:
    """
    Roboflow Object Detection으로 웹캠 프레임에서 Q-CODE 제품 감지 및 개수 카운트

    Args:
        image_path: 웹캠 프레임 이미지 경로

    Returns:
        {
            "success": True/False,
            "detected_products": [
                {"qcode": "Q1208172", "count": 3, "confidence": 0.85},
                ...
            ],
            "total_count": 5,
            "error": "..." (실패 시)
        }
    """
    # 클래스 이름 매핑 (Roboflow 학습 시 사용한 이름 -> Q-CODE)
    CLASS_NAME_TO_QCODE = {
        "Tangerine": "TANGERINE-001",  # 탄제린 (귤)
        "Egg": "EGG-001",  # 계란
        # 추가 매핑이 필요하면 여기에 추가:
        # "Apple": "Q1208172",
        # "Banana": "Q13425723",
    }

    try:
        # 모델 ID 확인
        if not ROBOFLOW_MODEL_ID:
            return {
                "success": False,
                "error": "ROBOFLOW_MODEL_ID not set in .env. Please train a model first.",
                "detected_products": [],
                "total_count": 0
            }

        print(f"[*] Roboflow Object Detection: Detecting products in frame...")
        print(f"    Model ID: {ROBOFLOW_MODEL_ID}")

        # Roboflow Inference API 호출 (Multipart 방식)
        url = f"{INFERENCE_URL}/{ROBOFLOW_MODEL_ID}"
        print(f"    Request URL: {url}")
        print(f"    API Key: {ROBOFLOW_API_KEY[:10]}...{ROBOFLOW_API_KEY[-4:]}")
        print(f"    Image path: {image_path}")

        # Multipart/form-data로 전송
        with open(image_path, "rb") as image_file:
            response = requests.post(
                url,
                params={"api_key": ROBOFLOW_API_KEY},
                files={"file": image_file}
            )

        print(f"    Response Status: {response.status_code}")
        if response.status_code != 200:
            print(f"    Response Body: {response.text}")
            raise Exception(f"Inference API error: {response.status_code} - {response.text}")

        result = response.json()

        # 각 클래스(Q-CODE)별 개수 카운트
        detections = result.get("predictions", [])
        print(f"    [DEBUG] Total predictions: {len(detections)}")
        if detections:
            print(f"    [DEBUG] First prediction: {detections[0]}")
        product_counts = {}

        for detection in detections:
            class_name = detection.get("class", "unknown")
            confidence = detection.get("confidence", 0.0)
            print(f"    [DEBUG] Detected class: '{class_name}', confidence: {confidence:.2f}")

            # 클래스 이름을 Q-CODE로 변환
            qcode = CLASS_NAME_TO_QCODE.get(class_name, class_name)

            if qcode not in product_counts:
                product_counts[qcode] = {"count": 0, "confidences": [], "boxes": []}

            product_counts[qcode]["count"] += 1
            product_counts[qcode]["confidences"].append(confidence)
            # 바운딩 박스 정보 저장
            product_counts[qcode]["boxes"].append({
                "x": detection.get("x"),
                "y": detection.get("y"),
                "width": detection.get("width"),
                "height": detection.get("height"),
                "confidence": confidence
            })

        # 평균 confidence 계산
        detected_products = []
        for qcode, data in product_counts.items():
            avg_confidence = sum(data["confidences"]) / len(data["confidences"])
            detected_products.append({
                "qcode": qcode,
                "count": data["count"],
                "confidence": float(avg_confidence),
                "bounding_boxes": data["boxes"]  # 바운딩 박스 정보 추가
            })
            print(f"    [DETECTED] {qcode}: {data['count']} items (conf: {avg_confidence:.2f})")

        total_count = len(detections)

        print(f"[OK] Detected {len(detected_products)} product types, {total_count} items total")

        return {
            "success": True,
            "detected_products": detected_products,
            "total_count": total_count,
            "raw_predictions": detections  # 전체 예측 결과도 포함
        }

    except Exception as e:
        print(f"[ERROR] detect_products_in_frame: {e}")
        return {
            "success": False,
            "error": str(e),
            "detected_products": [],
            "total_count": 0
        }
