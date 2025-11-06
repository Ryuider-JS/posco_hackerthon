"""
특정 이름의 제품 삭제 스크립트
"""
import sys
import codecs

# Windows에서 UTF-8 출력 강제
if sys.platform == 'win32':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')

sys.path.insert(0, '.')
from app.database import SessionLocal
from app.models.product import Product

def delete_product_by_name(product_name):
    """제품명으로 제품 삭제"""
    db = SessionLocal()

    try:
        print("=" * 80)
        print(f"제품 삭제: '{product_name}'")
        print("=" * 80)

        # 해당 이름의 제품 조회
        products = db.query(Product).filter(Product.name == product_name).all()

        if not products:
            print(f"⚠️  '{product_name}' 이름의 제품을 찾을 수 없습니다.")
            return

        print(f"\n찾은 제품: {len(products)}개")
        for product in products:
            print(f"  - Q-CODE: {product.qcode}")
            print(f"    제품명: {product.name}")
            print(f"    카테고리: {product.category}")
            print(f"    등록일: {product.created_at}")
            print()

        # 삭제 확인
        confirm = input(f"\n위 {len(products)}개 제품을 삭제하시겠습니까? (y/N): ")

        if confirm.lower() != 'y':
            print("❌ 삭제가 취소되었습니다.")
            return

        # 삭제 실행
        for product in products:
            db.delete(product)
            print(f"✅ 삭제됨: {product.qcode} - {product.name}")

        db.commit()

        print("\n" + "=" * 80)
        print(f"✅ 완료: {len(products)}개 제품 삭제됨")
        print("=" * 80)

    except Exception as e:
        db.rollback()
        print(f"\n❌ 에러 발생: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    delete_product_by_name("신규 제품")
