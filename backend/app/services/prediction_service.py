from datetime import datetime, timedelta
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from app.models.product import Product
from app.models.inventory import InventoryHistory

def predict_reorder_date(qcode: str, db: Session) -> Dict:
    """
    간단한 이동평균 방식으로 재주문 시점 예측

    Args:
        qcode: 제품 Q-CODE
        db: 데이터베이스 세션

    Returns:
        {
            "qcode": "Q-2411-1234",
            "product_name": "육각볼트",
            "current_stock": 54,
            "min_stock": 10,
            "reorder_point": 20,
            "days_until_reorder": 5,
            "reorder_date": "2025-11-11",
            "days_until_stockout": 8,
            "stockout_date": "2025-11-14",
            "daily_consumption_rate": 6.5,
            "status": "safe" | "warning" | "critical",
            "confidence": 0.8
        }
    """
    try:
        # 제품 조회
        product = db.query(Product).filter(Product.qcode == qcode).first()

        if not product:
            return {
                "success": False,
                "error": "제품을 찾을 수 없습니다"
            }

        # 최근 7일 재고 이력 조회
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        history = db.query(InventoryHistory)\
            .filter(InventoryHistory.qcode == qcode)\
            .filter(InventoryHistory.timestamp >= seven_days_ago)\
            .order_by(InventoryHistory.timestamp)\
            .all()

        # 데이터가 2개 미만이면 예측 불가
        if len(history) < 2:
            return {
                "success": True,
                "qcode": qcode,
                "product_name": product.name,
                "current_stock": product.current_stock,
                "min_stock": product.min_stock,
                "reorder_point": product.reorder_point,
                "status": _get_stock_status(product.current_stock, product.reorder_point, product.min_stock),
                "message": "예측 데이터 부족 (최소 2개 필요)",
                "insufficient_data": True
            }

        # 평균 일일 소비량 계산
        first_record = history[0]
        last_record = history[-1]

        quantity_diff = first_record.quantity - last_record.quantity
        time_span = (last_record.timestamp - first_record.timestamp).total_seconds() / 86400  # 일수로 변환

        if time_span <= 0:
            return {
                "success": True,
                "qcode": qcode,
                "product_name": product.name,
                "current_stock": product.current_stock,
                "status": _get_stock_status(product.current_stock, product.reorder_point, product.min_stock),
                "message": "시간 간격이 너무 짧습니다",
                "insufficient_data": True
            }

        daily_consumption_rate = quantity_diff / time_span if time_span > 0 else 0

        # 재고가 증가 추세면 예측 불필요
        if daily_consumption_rate <= 0:
            return {
                "success": True,
                "qcode": qcode,
                "product_name": product.name,
                "current_stock": product.current_stock,
                "min_stock": product.min_stock,
                "reorder_point": product.reorder_point,
                "status": "safe",
                "message": "재고가 증가 추세입니다",
                "daily_consumption_rate": daily_consumption_rate,
                "no_consumption": True
            }

        # 재주문 시점까지 남은 일수 계산
        current_stock = product.current_stock
        reorder_point = product.reorder_point
        min_stock = product.min_stock

        days_until_reorder = (current_stock - reorder_point) / daily_consumption_rate
        days_until_stockout = (current_stock - min_stock) / daily_consumption_rate

        # 예상 날짜 계산
        reorder_date = datetime.utcnow() + timedelta(days=days_until_reorder)
        stockout_date = datetime.utcnow() + timedelta(days=days_until_stockout)

        # 상태 결정
        status = _get_stock_status(current_stock, reorder_point, min_stock)

        # 신뢰도 계산 (데이터 포인트가 많을수록 높음)
        confidence = min(len(history) / 10.0, 1.0)  # 최대 1.0

        return {
            "success": True,
            "qcode": qcode,
            "product_name": product.name,
            "current_stock": current_stock,
            "min_stock": min_stock,
            "reorder_point": reorder_point,
            "stock_unit": product.stock_unit,
            "days_until_reorder": round(days_until_reorder, 1),
            "reorder_date": reorder_date.strftime("%Y-%m-%d"),
            "days_until_stockout": round(days_until_stockout, 1),
            "stockout_date": stockout_date.strftime("%Y-%m-%d"),
            "daily_consumption_rate": round(daily_consumption_rate, 2),
            "status": status,
            "confidence": round(confidence, 2),
            "data_points": len(history)
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def get_all_predictions(db: Session) -> List[Dict]:
    """
    모든 제품의 재주문 예측 조회

    Returns:
        List of prediction results
    """
    all_products = db.query(Product).all()
    predictions = []

    for product in all_products:
        prediction = predict_reorder_date(product.qcode, db)
        if prediction.get("success"):
            predictions.append(prediction)

    # 긴급도 순 정렬 (critical > warning > safe)
    def sort_key(p):
        status_priority = {"critical": 0, "warning": 1, "safe": 2}
        return (
            status_priority.get(p.get("status"), 3),
            p.get("days_until_reorder", 999)
        )

    predictions.sort(key=sort_key)

    return predictions

def get_low_stock_alerts(db: Session, selected_qcodes: Optional[List[str]] = None) -> List[Dict]:
    """
    재고 부족 알림 목록 조회 (단순화 버전)

    추세 계산 없이 현재 재고 수준만으로 판단:
    - current_stock <= min_stock → critical
    - current_stock <= reorder_point → warning

    Args:
        db: 데이터베이스 세션
        selected_qcodes: 선택된 Q-CODE 목록 (None이면 전체 제품)

    Returns:
        긴급 및 경고 상태 제품 목록
    """
    all_products = db.query(Product).all()
    alerts = []

    # 선택된 제품이 있으면 필터링용 set 생성
    qcode_filter = set(selected_qcodes) if selected_qcodes else None

    for product in all_products:
        # 선택된 제품 필터링
        if qcode_filter and product.qcode not in qcode_filter:
            continue

        # 재고 상태 판단
        status = _get_stock_status(product.current_stock, product.reorder_point, product.min_stock)

        # critical 또는 warning 상태만 알림에 포함
        if status in ["critical", "warning"]:
            alerts.append({
                "qcode": product.qcode,
                "product_name": product.name,
                "current_stock": product.current_stock,
                "min_stock": product.min_stock,
                "reorder_point": product.reorder_point,
                "stock_unit": product.stock_unit,
                "status": status,
                "insufficient_data": False  # 항상 false (추세 계산 안 함)
            })

    # 상태별 정렬 (critical > warning)
    alerts.sort(key=lambda x: (0 if x["status"] == "critical" else 1, x["current_stock"]))

    return alerts

def _get_stock_status(current_stock: int, reorder_point: int, min_stock: int) -> str:
    """
    재고 상태 판단

    Returns:
        "safe" | "warning" | "critical"
    """
    if current_stock <= min_stock:
        return "critical"  # 최소 재고 이하
    elif current_stock <= reorder_point:
        return "warning"   # 재주문 시점 이하
    else:
        return "safe"      # 안전
