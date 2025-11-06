from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
import shutil
import os
from datetime import datetime
import json

from app.database import get_db
from app.models.product import Product, generate_qcode
from app.services.roboflow_service import (
    search_similar_products_roboflow,
    detect_products_in_frame
)
# 사용하지 않는 서비스 주석처리
# from app.services.ai_service import (
#     analyze_product_image,
#     analyze_with_specs,
#     compare_with_existing_products
# )
# from app.services.gemini_service import (
#     analyze_product_image_gemini,
#     calculate_similarity_with_gemini
# )
# from app.services.vision_service import (
#     search_similar_products_vision,
#     create_product_in_vision
# )

router = APIRouter(prefix="/api", tags=["products"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/analyze-image")
async def analyze_image(
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    material: Optional[str] = Form(None),
    diameter: Optional[str] = Form(None),
    length: Optional[str] = Form(None),
    specs: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    제품 이미지 업로드 및 Roboflow CLIP 기반 유사도 검색

    OpenAI/Gemini 제거 - 사용자가 기본 정보 직접 입력
    Roboflow CLIP으로 기존 제품과 유사도 비교
    """
    try:
        # 1. 이미지 저장
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_extension = os.path.splitext(file.filename)[1]
        filename = f"product_{timestamp}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        print(f"[*] Image uploaded: {file_path}")

        # 2. Roboflow CLIP 유사도 검색
        existing_products = db.query(Product).all()
        # Use for_api=False to keep absolute paths for file access
        existing_products_dict = [p.to_dict(for_api=False) for p in existing_products]

        roboflow_results = search_similar_products_roboflow(
            file_path, existing_products_dict
        )

        # 3. 사용자 입력 데이터
        user_input = {
            "name": name,
            "category": category,
            "material": material,
            "diameter": diameter,
            "length": length,
            "specs": specs
        }

        return {
            "success": True,
            "image_path": file_path,
            "user_input": user_input,
            "similar_products": roboflow_results.get("similar_products", []),
            "similarity_method": "roboflow_clip",
            "roboflow_success": roboflow_results["success"],
            "roboflow_error": roboflow_results.get("error")
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/products")
async def create_product(
    name: str = Form(...),
    category: str = Form("미분류"),
    description: Optional[str] = Form(None),
    image_path: Optional[str] = Form(None),
    diameter: Optional[str] = Form(None),
    length: Optional[str] = Form(None),
    material: Optional[str] = Form(None),
    specs: Optional[str] = Form(None),
    last_price: Optional[float] = Form(0.0),
    # 카탈로그 정보 추가
    n2b_product_code: Optional[str] = Form(None),
    model_name: Optional[str] = Form(None),
    manufacturer: Optional[str] = Form(None),
    sourcing_group: Optional[str] = Form(None),
    leaf_class: Optional[str] = Form(None),
    standard_name: Optional[str] = Form(None),
    attributes: Optional[str] = Form(None),  # JSON string
    db: Session = Depends(get_db)
):
    """
    Register a new product with Q-CODE
    확장 필드: model_name, manufacturer, n2b_product_code, attributes (JSON)
    """
    try:
        # Generate Q-CODE
        qcode = generate_qcode()

        # Create new product in database
        new_product = Product(
            qcode=qcode,
            name=name,
            category=category,
            description=description,
            image_path=image_path,
            diameter=diameter,
            length=length,
            material=material,
            specs=specs,
            last_price=last_price,
            purchase_count=0,
            average_rating=0.0,
            # 카탈로그 정보
            n2b_product_code=n2b_product_code,
            model_name=model_name,
            manufacturer=manufacturer,
            sourcing_group=sourcing_group,
            leaf_class=leaf_class,
            standard_name=standard_name,
            attributes=attributes  # JSON string 그대로 저장
        )

        db.add(new_product)
        db.commit()
        db.refresh(new_product)

        # Vision API 사용 안 함 - Roboflow로 대체
        # vision_registered = False
        # if image_path and os.path.exists(image_path):
        #     try:
        #         product_labels = {}
        #         if material:
        #             product_labels['material'] = material
        #         if category:
        #             product_labels['category'] = category
        #         if diameter:
        #             product_labels['diameter'] = diameter
        #
        #         vision_result = create_product_in_vision(
        #             product_id=qcode,
        #             display_name=name,
        #             description=description or "",
        #             image_path=image_path,
        #             product_labels=product_labels
        #         )
        #
        #         vision_registered = vision_result.get("success", False)
        #         if vision_registered:
        #             print(f"✅ Product {qcode} registered in Vision API")
        #         else:
        #             print(f"⚠️ Vision API registration failed: {vision_result.get('error')}")
        #
        #     except Exception as vision_error:
        #         print(f"⚠️ Vision API error (non-fatal): {vision_error}")

        result = new_product.to_dict()
        # result["vision_api_registered"] = vision_registered

        return result

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/products")
async def list_products(
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    search: Optional[str] = None,
    manufacturer: Optional[str] = None,
    sourcing_group: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    List all products with optional filtering

    Filters:
    - category: 제품 카테고리
    - search: 제품명, Q-CODE, 스펙, 모델명, 제조사, 엔투비품번, 재질 검색
    - manufacturer: 제조사 필터
    - sourcing_group: 표준소싱그룹 필터
    """
    query = db.query(Product)

    if category:
        query = query.filter(Product.category == category)

    if manufacturer:
        query = query.filter(Product.manufacturer == manufacturer)

    if sourcing_group:
        query = query.filter(Product.sourcing_group == sourcing_group)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Product.name.like(search_term)) |
            (Product.description.like(search_term)) |
            (Product.qcode.like(search_term)) |
            (Product.material.like(search_term)) |
            (Product.specs.like(search_term)) |
            (Product.model_name.like(search_term)) |
            (Product.manufacturer.like(search_term)) |
            (Product.standard_name.like(search_term)) |
            (Product.n2b_product_code.like(search_term))
        )

    products = query.offset(skip).limit(limit).all()

    return {
        "total": query.count(),
        "products": [p.to_dict() for p in products]
    }

@router.get("/products/{qcode}")
async def get_product(qcode: str, db: Session = Depends(get_db)):
    """
    Get a specific product by Q-CODE
    """
    product = db.query(Product).filter(Product.qcode == qcode).first()

    if not product:
        raise HTTPException(status_code=404, detail="제품을 찾을 수 없습니다")

    return product.to_dict()

@router.put("/products/{qcode}")
async def update_product(
    qcode: str,
    name: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    diameter: Optional[str] = Form(None),
    length: Optional[str] = Form(None),
    material: Optional[str] = Form(None),
    specs: Optional[str] = Form(None),
    last_price: Optional[float] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Update an existing product
    """
    product = db.query(Product).filter(Product.qcode == qcode).first()

    if not product:
        raise HTTPException(status_code=404, detail="제품을 찾을 수 없습니다")

    if name is not None:
        product.name = name
    if category is not None:
        product.category = category
    if description is not None:
        product.description = description
    if diameter is not None:
        product.diameter = diameter
    if length is not None:
        product.length = length
    if material is not None:
        product.material = material
    if specs is not None:
        product.specs = specs
    if last_price is not None:
        product.last_price = last_price

    db.commit()
    db.refresh(product)

    return product.to_dict()

@router.delete("/products/{qcode}")
async def delete_product(qcode: str, db: Session = Depends(get_db)):
    """
    Delete a product by Q-CODE
    """
    product = db.query(Product).filter(Product.qcode == qcode).first()

    if not product:
        raise HTTPException(status_code=404, detail="제품을 찾을 수 없습니다")

    db.delete(product)
    db.commit()

    return {"message": "제품이 삭제되었습니다", "qcode": qcode}

# OpenAI 스펙 분석 사용 안 함 - 주석처리
# @router.post("/products/search-by-specs")
# async def search_by_specs(
#     specs_text: str = Form(...),
#     db: Session = Depends(get_db)
# ):
#     """
#     Search for products using text specifications
#     """
#     try:
#         # Analyze specs with AI
#         specs_result = analyze_with_specs(specs_text)
#
#         if not specs_result["success"]:
#             raise HTTPException(status_code=500, detail="스펙 분석 실패")
#
#         analysis_data = specs_result.get("analysis") or {}
#
#         # Get all existing products
#         existing_products = db.query(Product).all()
#         existing_products_dict = [p.to_dict() for p in existing_products]
#
#         # Find similar products
#         similar_products = compare_with_existing_products(
#             analysis_data, existing_products_dict
#         )
#
#         return {
#             "success": True,
#             "analyzed_specs": analysis_data,
#             "ai_analysis": specs_result["raw_text"],
#             "similar_products": similar_products[:10]
#         }
#
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

@router.post("/detect-qcode")
async def detect_qcode(
    file: UploadFile = File(...),
    selected_qcodes: Optional[str] = Form(None),  # 쉼표로 구분된 Q-CODE 목록
    db: Session = Depends(get_db)
):
    """
    웹캠 프레임에서 Q-CODE 제품 감지 및 재고 카운팅
    Roboflow Object Detection 사용 (Gemini 대체)

    Args:
        file: 웹캠 프레임 이미지
        selected_qcodes: 감지할 제품 Q-CODE 목록 (쉼표 구분, 예: "Q1208172,Q13425723")
                        None이면 전체 제품 감지
    """
    print("\n" + "="*80)
    print("[API CALL] /api/detect-qcode - 웹캠 프레임 수신")

    # 선택된 제품 목록 파싱
    qcode_filter = None
    if selected_qcodes and selected_qcodes.strip():
        qcode_filter = set(qc.strip() for qc in selected_qcodes.split(',') if qc.strip())
        print(f"[*] 선택된 제품 필터: {qcode_filter}")
    else:
        print("[*] 전체 제품 감지 모드")
    print("="*80)

    try:
        # 1. 웹캠 프레임 저장
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"webcam_{timestamp}.jpg"
        file_path = os.path.join(UPLOAD_DIR, filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        print(f"[*] Webcam frame saved: {file_path}")

        # 2. Roboflow Object Detection으로 제품 감지
        detection_result = detect_products_in_frame(file_path)

        if not detection_result["success"]:
            return {
                "success": False,
                "message": "제품 감지 실패",
                "detected_products": [],
                "error": detection_result.get("error")
            }

        if not detection_result.get("detected_products"):
            return {
                "success": True,
                "message": "감지된 제품 없음",
                "detected_products": [],
                "total_count": 0
            }

        # 3. 재고 업데이트 및 이력 기록
        from app.models.inventory import InventoryHistory
        detected_products_info = []

        for detected in detection_result["detected_products"]:
            qcode = detected["qcode"]
            count = detected["count"]
            confidence = detected["confidence"]

            # 선택된 제품 필터링
            if qcode_filter and qcode not in qcode_filter:
                print(f"[SKIP] {qcode} - 선택된 제품이 아님")
                continue

            # 해당 Q-CODE의 제품 조회
            product = db.query(Product).filter(Product.qcode == qcode).first()

            if product:
                # 이전 재고 수량
                previous_stock = product.current_stock

                # 현재 재고 업데이트
                product.current_stock = count

                # 재고 변화량 계산
                quantity_change = count - previous_stock

                # 재고 이력 기록
                history_entry = InventoryHistory(
                    qcode=qcode,
                    quantity=count,
                    quantity_change=quantity_change,
                    detection_confidence=confidence,
                    detection_method="roboflow_object_detection",
                    frame_path=file_path,
                    timestamp=datetime.utcnow()
                )
                db.add(history_entry)

                # 감지된 제품 정보 추가
                product_info = product.to_dict()
                product_info["detected_count"] = count
                product_info["confidence"] = confidence
                product_info["quantity_change"] = quantity_change
                detected_products_info.append(product_info)

                print(f"[OK] {qcode}: {count} items detected (change: {quantity_change:+d})")
            else:
                print(f"[WARN] Detected Q-CODE {qcode} not found in database")

        # DB 커밋
        db.commit()

        return {
            "success": True,
            "message": f"{len(detected_products_info)}개 제품 감지됨",
            "detected_products": detected_products_info,
            "total_count": detection_result["total_count"],
            "detection_method": "roboflow_yolov8",
            "frame_path": file_path,
            "raw_predictions": detection_result.get("raw_predictions", [])  # 바운딩 박스 정보 추가
        }

    except Exception as e:
        db.rollback()
        print(f"[ERROR] detect_qcode: {e}")
        raise HTTPException(status_code=500, detail=f"Q-CODE 감지 실패: {str(e)}")
