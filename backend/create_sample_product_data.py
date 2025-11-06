"""
8개 제품에 대한 샘플 카탈로그 및 구매 예측 데이터 생성
"""
import sys
import codecs
import json
from datetime import datetime

# Windows에서 UTF-8 출력 강제
if sys.platform == 'win32':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')

sys.path.insert(0, '.')
from app.database import SessionLocal
from app.models.product import Product

# 8개 제품 샘플 데이터
SAMPLE_DATA = {
    "Q1208172": {
        "n2b_product_code": "11001234",
        "standard_name": "산업용 볼트",
        "model_name": "HEX-M12-50",
        "manufacturer": "포스코케미칼",
        "sourcing_group": "기계/기구/공구",
        "leaf_class": "체결용품",
        "specs": "육각볼트,M12x50,STS304,KS B 1002",
        "attributes": {
            "규격": "M12",
            "길이": "50mm",
            "재질": "STS304",
            "마감": "무전해니켈도금"
        },
        "last_order_date": "2024-10-15",
        "next_predicted_purchase_date": "2025-04-20",
        "avg_purchase_interval_days": 187.0,
        "last_price": 15000.0,
        "purchase_count": 24,
        "category": "기계/기구/공구",
        "material": "STS304"
    },
    "Q13425723": {
        "n2b_product_code": "11002567",
        "standard_name": "산업용 너트",
        "model_name": "NUT-M10-HEX",
        "manufacturer": "대한금속",
        "sourcing_group": "기계/기구/공구",
        "leaf_class": "체결용품",
        "specs": "육각너트,M10,STS316,KS B 1012",
        "attributes": {
            "규격": "M10",
            "재질": "STS316",
            "표면처리": "전해연마"
        },
        "last_order_date": "2024-09-20",
        "next_predicted_purchase_date": "2025-03-15",
        "avg_purchase_interval_days": 176.0,
        "last_price": 8000.0,
        "purchase_count": 18,
        "category": "기계/기구/공구",
        "material": "STS316"
    },
    "Q13527880": {
        "n2b_product_code": "11003890",
        "standard_name": "산업용 와셔",
        "model_name": "WASHER-M12-FLAT",
        "manufacturer": "한국파스너",
        "sourcing_group": "기계/기구/공구",
        "leaf_class": "체결용품",
        "specs": "평와셔,M12,STS304,KS B 1326",
        "attributes": {
            "규격": "M12",
            "두께": "2.5mm",
            "재질": "STS304"
        },
        "last_order_date": "2024-11-01",
        "next_predicted_purchase_date": "2025-05-10",
        "avg_purchase_interval_days": 190.0,
        "last_price": 3000.0,
        "purchase_count": 32,
        "category": "기계/기구/공구",
        "material": "STS304"
    },
    "TANGERINE-001": {
        "n2b_product_code": "20001111",
        "standard_name": "탄제린 (귤)",
        "model_name": "TANGERINE-PREMIUM",
        "manufacturer": "제주감귤농협",
        "sourcing_group": "식품/음료",
        "leaf_class": "과일류",
        "specs": "탄제린,프리미엄,제주산,당도 12Brix 이상",
        "attributes": {
            "원산지": "제주도",
            "등급": "특",
            "당도": "12Brix 이상",
            "크기": "중과"
        },
        "last_order_date": "2024-10-28",
        "next_predicted_purchase_date": "2024-12-15",
        "avg_purchase_interval_days": 48.0,
        "last_price": 45000.0,
        "purchase_count": 56,
        "category": "식품",
        "material": None
    },
    "Q13358225": {
        "n2b_product_code": "11004512",
        "standard_name": "산업용 스프링와셔",
        "model_name": "SPRING-WASHER-M10",
        "manufacturer": "대한금속",
        "sourcing_group": "기계/기구/공구",
        "leaf_class": "체결용품",
        "specs": "스프링와셔,M10,STS304,KS B 1327",
        "attributes": {
            "규격": "M10",
            "재질": "STS304",
            "표면처리": "무전해니켈도금"
        },
        "last_order_date": "2024-10-05",
        "next_predicted_purchase_date": "2025-04-01",
        "avg_purchase_interval_days": 178.0,
        "last_price": 5000.0,
        "purchase_count": 21,
        "category": "기계/기구/공구",
        "material": "STS304"
    },
    "Q4427132": {
        "n2b_product_code": "11005678",
        "standard_name": "산업용 앵커볼트",
        "model_name": "ANCHOR-M16-100",
        "manufacturer": "포스코케미칼",
        "sourcing_group": "기계/기구/공구",
        "leaf_class": "앵커/철물",
        "specs": "앵커볼트,M16x100,탄소강,아연도금",
        "attributes": {
            "규격": "M16",
            "길이": "100mm",
            "재질": "탄소강",
            "표면처리": "용융아연도금"
        },
        "last_order_date": "2024-09-12",
        "next_predicted_purchase_date": "2025-03-20",
        "avg_purchase_interval_days": 189.0,
        "last_price": 25000.0,
        "purchase_count": 15,
        "category": "기계/기구/공구",
        "material": "탄소강"
    },
    "Q4508804": {
        "n2b_product_code": "11006789",
        "standard_name": "산업용 나사못",
        "model_name": "SCREW-PAN-M5-30",
        "manufacturer": "한국파스너",
        "sourcing_group": "기계/기구/공구",
        "leaf_class": "체결용품",
        "specs": "십자나사,팬헤드,M5x30,STS304",
        "attributes": {
            "규격": "M5",
            "길이": "30mm",
            "헤드형상": "팬헤드",
            "재질": "STS304"
        },
        "last_order_date": "2024-10-22",
        "next_predicted_purchase_date": "2025-04-15",
        "avg_purchase_interval_days": 175.0,
        "last_price": 7000.0,
        "purchase_count": 28,
        "category": "기계/기구/공구",
        "material": "STS304"
    },
    "EGG-001": {
        "n2b_product_code": "20002222",
        "standard_name": "계란 (특란)",
        "model_name": "EGG-SPECIAL",
        "manufacturer": "목우촌",
        "sourcing_group": "식품/음료",
        "leaf_class": "축산물",
        "specs": "계란,특란,무항생제,동물복지인증",
        "attributes": {
            "등급": "1+등급",
            "중량": "68g 이상",
            "인증": "무항생제,동물복지",
            "원산지": "국내산"
        },
        "last_order_date": "2024-11-03",
        "next_predicted_purchase_date": "2024-11-17",
        "avg_purchase_interval_days": 14.0,
        "last_price": 8000.0,
        "purchase_count": 78,
        "category": "식품",
        "material": None
    }
}


def update_sample_data():
    """8개 제품에 샘플 데이터 업데이트"""
    db = SessionLocal()

    try:
        print("=" * 80)
        print("8개 제품 샘플 데이터 업데이트")
        print("=" * 80)

        updated_count = 0
        not_found = []

        for qcode, data in SAMPLE_DATA.items():
            product = db.query(Product).filter(Product.qcode == qcode).first()

            if not product:
                not_found.append(qcode)
                print(f"⚠️  제품 없음: {qcode}")
                continue

            # 데이터 업데이트
            product.n2b_product_code = data.get("n2b_product_code")
            product.standard_name = data.get("standard_name")
            product.model_name = data.get("model_name")
            product.manufacturer = data.get("manufacturer")
            product.sourcing_group = data.get("sourcing_group")
            product.leaf_class = data.get("leaf_class")
            product.specs = data.get("specs")
            product.attributes = json.dumps(data.get("attributes"), ensure_ascii=False)  # JSON으로 저장
            product.last_price = data.get("last_price")
            product.purchase_count = data.get("purchase_count")
            product.category = data.get("category")
            product.material = data.get("material")

            # 날짜 파싱
            if data.get("last_order_date"):
                product.last_order_date = datetime.strptime(data["last_order_date"], "%Y-%m-%d")
            if data.get("next_predicted_purchase_date"):
                product.next_predicted_purchase_date = datetime.strptime(
                    data["next_predicted_purchase_date"], "%Y-%m-%d"
                )
            product.avg_purchase_interval_days = data.get("avg_purchase_interval_days")

            # name 업데이트 (standard_name 사용)
            if data.get("standard_name"):
                product.name = data["standard_name"]

            updated_count += 1
            print(f"✅ 업데이트: {qcode} - {product.name} ({product.manufacturer})")

        db.commit()

        print("\n" + "=" * 80)
        print(f"✅ 완료: {updated_count}개 제품 업데이트")
        if not_found:
            print(f"⚠️  찾지 못한 제품: {', '.join(not_found)}")
        print("=" * 80)

    except Exception as e:
        db.rollback()
        print(f"\n❌ 에러 발생: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    update_sample_data()
