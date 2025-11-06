from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from app.database import get_db
from app.models.product import Product
from app.models.inventory import InventoryHistory
from app.services.prediction_service import (
    predict_reorder_date,
    get_all_predictions,
    get_low_stock_alerts
)

router = APIRouter(prefix="/api")

@router.get("/inventory/current")
async def get_current_inventory(db: Session = Depends(get_db)):
    """
    전체 제품의 현재 재고 현황 조회
    """
    try:
        products = db.query(Product).all()

        inventory = []
        for product in products:
            product_dict = product.to_dict()

            # 재고 상태 추가
            if product.current_stock <= product.min_stock:
                product_dict["stock_status"] = "critical"
            elif product.current_stock <= product.reorder_point:
                product_dict["stock_status"] = "warning"
            else:
                product_dict["stock_status"] = "safe"

            inventory.append(product_dict)

        # 상태별 카운트
        critical_count = sum(1 for p in inventory if p["stock_status"] == "critical")
        warning_count = sum(1 for p in inventory if p["stock_status"] == "warning")
        safe_count = sum(1 for p in inventory if p["stock_status"] == "safe")

        return {
            "total_products": len(inventory),
            "critical_count": critical_count,
            "warning_count": warning_count,
            "safe_count": safe_count,
            "products": inventory
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/inventory/history/{qcode}")
async def get_inventory_history(
    qcode: str,
    days: Optional[int] = 30,
    db: Session = Depends(get_db)
):
    """
    특정 제품의 재고 이력 조회

    Args:
        qcode: 제품 Q-CODE
        days: 조회 기간 (기본 30일)
    """
    try:
        # 제품 존재 확인
        product = db.query(Product).filter(Product.qcode == qcode).first()
        if not product:
            raise HTTPException(status_code=404, detail="제품을 찾을 수 없습니다")

        # 재고 이력 조회
        start_date = datetime.utcnow() - timedelta(days=days)
        history = db.query(InventoryHistory)\
            .filter(InventoryHistory.qcode == qcode)\
            .filter(InventoryHistory.timestamp >= start_date)\
            .order_by(InventoryHistory.timestamp.desc())\
            .all()

        history_list = [h.to_dict() for h in history]

        return {
            "qcode": qcode,
            "product_name": product.name,
            "current_stock": product.current_stock,
            "history_count": len(history_list),
            "history": history_list
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/inventory/predictions")
async def get_predictions(db: Session = Depends(get_db)):
    """
    전체 제품의 구매 예측 조회
    """
    try:
        predictions = get_all_predictions(db)

        # 통계
        critical = [p for p in predictions if p.get("status") == "critical"]
        warning = [p for p in predictions if p.get("status") == "warning"]

        return {
            "total_products": len(predictions),
            "critical_count": len(critical),
            "warning_count": len(warning),
            "predictions": predictions
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/inventory/predictions/{qcode}")
async def get_prediction_by_qcode(qcode: str, db: Session = Depends(get_db)):
    """
    특정 제품의 구매 예측 조회
    """
    try:
        prediction = predict_reorder_date(qcode, db)

        if not prediction.get("success"):
            raise HTTPException(
                status_code=404,
                detail=prediction.get("error", "예측 실패")
            )

        return prediction

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/inventory/alerts")
async def get_alerts(
    selected_qcodes: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    재고 부족 알림 목록 조회 (critical, warning 상태)

    Args:
        selected_qcodes: 선택된 Q-CODE 목록 (쉼표로 구분, 예: "Q1,Q2,Q3")
                        None이면 전체 제품 조회
    """
    try:
        # 선택된 제품 목록 파싱
        qcode_list = None
        if selected_qcodes and selected_qcodes.strip():
            qcode_list = [qc.strip() for qc in selected_qcodes.split(',') if qc.strip()]

        alerts = get_low_stock_alerts(db, qcode_list)

        return {
            "alert_count": len(alerts),
            "alerts": alerts
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/inventory/record")
async def record_inventory(
    qcode: str,
    quantity: int,
    notes: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    수동으로 재고 수량 기록

    Args:
        qcode: 제품 Q-CODE
        quantity: 재고 수량
        notes: 메모 (선택)
    """
    try:
        # 제품 존재 확인
        product = db.query(Product).filter(Product.qcode == qcode).first()
        if not product:
            raise HTTPException(status_code=404, detail="제품을 찾을 수 없습니다")

        # 이전 재고
        previous_stock = product.current_stock

        # 현재 재고 업데이트
        product.current_stock = quantity

        # 재고 이력 기록
        history_entry = InventoryHistory(
            qcode=qcode,
            quantity=quantity,
            quantity_change=quantity - previous_stock,
            detection_method="manual_adjustment",
            notes=notes,
            timestamp=datetime.utcnow()
        )
        db.add(history_entry)
        db.commit()

        return {
            "success": True,
            "message": "재고가 기록되었습니다",
            "qcode": qcode,
            "previous_stock": previous_stock,
            "current_stock": quantity,
            "quantity_change": quantity - previous_stock
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
