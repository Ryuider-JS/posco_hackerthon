from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
import random
import string

def generate_qcode():
    """Generate unique Q-CODE in format Q-XXXX-YYYY"""
    timestamp = datetime.now().strftime("%y%m")
    random_suffix = ''.join(random.choices(string.digits, k=4))
    return f"Q-{timestamp}-{random_suffix}"

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    qcode = Column(String, unique=True, index=True, default=generate_qcode)
    name = Column(String, nullable=False)
    category = Column(String, default="미분류")
    description = Column(Text)
    image_path = Column(String)

    # Spec fields for text-based search
    diameter = Column(String)  # 직경
    length = Column(String)    # 길이
    material = Column(String)  # 재질
    specs = Column(Text)       # Additional specs in text format

    # 카탈로그 정보 (Catalog information)
    n2b_product_code = Column(String, index=True)  # 엔투비품번
    customer_code_1 = Column(String)  # 고객사품번1
    sourcing_group = Column(String, index=True)  # 표준소싱그룹
    leaf_class = Column(String, index=True)  # 리프클래스
    standard_name = Column(String)  # 표준품명
    model_name = Column(String)  # 모델명
    manufacturer = Column(String, index=True)  # 제조사
    is_standardized = Column(Boolean, default=False)  # 표준화여부
    is_public = Column(Boolean, default=True)  # 공개여부
    attributes = Column(JSON)  # 개별속성 (Key-Value pairs in JSON)

    # Purchase history
    purchase_count = Column(Integer, default=0)
    average_rating = Column(Float, default=0.0)
    last_price = Column(Float, default=0.0)

    # 구매 예측 정보 (Purchase prediction)
    last_order_date = Column(DateTime)  # 최근 주문일
    next_predicted_purchase_date = Column(DateTime)  # 예상 다음 구매일
    avg_purchase_interval_days = Column(Float)  # 평균 구매 간격(일)

    # Inventory management (재고 관리)
    current_stock = Column(Integer, default=0)          # 현재 재고 수량
    min_stock = Column(Integer, default=10)             # 최소 재고 (경고 기준)
    max_stock = Column(Integer, default=100)            # 최대 재고
    reorder_point = Column(Integer, default=20)         # 재주문 시점
    stock_unit = Column(String, default="개")           # 재고 단위
    low_stock_alert = Column(Boolean, default=True)     # 재고 부족 알림 활성화

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    history = relationship("InventoryHistory", back_populates="product", cascade="all, delete-orphan")

    def to_dict(self, for_api=True):
        # Convert absolute image path to relative URL for frontend
        image_url = self.image_path

        # Only convert to relative path if this is for API response
        if for_api and image_url:
            # Convert Windows backslashes to forward slashes
            image_url = image_url.replace("\\", "/")

            # Extract path after "product_list_picture/"
            if "product_list_picture/" in image_url:
                relative_path = image_url.split("product_list_picture/")[1]
                image_url = f"product_list_picture/{relative_path}"
            # Extract path after "uploads/"
            elif "uploads/" in image_url:
                relative_path = image_url.split("uploads/")[1]
                image_url = f"uploads/{relative_path}"

        return {
            "id": self.id,
            "qcode": self.qcode,
            "name": self.name,
            "category": self.category,
            "description": self.description,
            "image_path": image_url,
            "diameter": self.diameter,
            "length": self.length,
            "material": self.material,
            "specs": self.specs,
            # 카탈로그 정보
            "n2b_product_code": self.n2b_product_code,
            "customer_code_1": self.customer_code_1,
            "sourcing_group": self.sourcing_group,
            "leaf_class": self.leaf_class,
            "standard_name": self.standard_name,
            "model_name": self.model_name,
            "manufacturer": self.manufacturer,
            "is_standardized": self.is_standardized,
            "is_public": self.is_public,
            "attributes": self.attributes,
            # 구매 정보
            "purchase_count": self.purchase_count,
            "average_rating": self.average_rating,
            "last_price": self.last_price,
            "last_order_date": self.last_order_date.isoformat() if self.last_order_date else None,
            "next_predicted_purchase_date": self.next_predicted_purchase_date.isoformat() if self.next_predicted_purchase_date else None,
            "avg_purchase_interval_days": self.avg_purchase_interval_days,
            # 재고 정보
            "current_stock": self.current_stock,
            "min_stock": self.min_stock,
            "max_stock": self.max_stock,
            "reorder_point": self.reorder_point,
            "stock_unit": self.stock_unit,
            "low_stock_alert": self.low_stock_alert,
            # 타임스탬프
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
