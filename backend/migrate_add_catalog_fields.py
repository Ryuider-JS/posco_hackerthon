"""
DB 마이그레이션: Product 테이블에 카탈로그 및 구매 예측 필드 추가
"""
import sqlite3
import sys
import codecs

# Windows에서 UTF-8 출력 강제
if sys.platform == 'win32':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')

DB_PATH = "./qcode.db"

def migrate():
    """ALTER TABLE로 새 컬럼 추가"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        print("=" * 80)
        print("DB 마이그레이션 시작: Product 테이블 확장")
        print("=" * 80)

        # 추가할 컬럼 목록
        new_columns = [
            # 카탈로그 정보
            ("n2b_product_code", "TEXT"),
            ("customer_code_1", "TEXT"),
            ("sourcing_group", "TEXT"),
            ("leaf_class", "TEXT"),
            ("standard_name", "TEXT"),
            ("model_name", "TEXT"),
            ("manufacturer", "TEXT"),
            ("is_standardized", "INTEGER DEFAULT 0"),
            ("is_public", "INTEGER DEFAULT 1"),
            ("attributes", "TEXT"),  # JSON as TEXT
            # 구매 예측 정보
            ("last_order_date", "DATETIME"),
            ("next_predicted_purchase_date", "DATETIME"),
            ("avg_purchase_interval_days", "REAL"),
        ]

        for column_name, column_type in new_columns:
            try:
                sql = f"ALTER TABLE products ADD COLUMN {column_name} {column_type}"
                cursor.execute(sql)
                print(f"  ✅ Added column: {column_name} ({column_type})")
            except sqlite3.OperationalError as e:
                if "duplicate column name" in str(e).lower():
                    print(f"  ⏭️  Column {column_name} already exists (skipping)")
                else:
                    raise

        conn.commit()

        # 인덱스 추가
        print("\n인덱스 생성 중...")
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_n2b_product_code ON products(n2b_product_code)",
            "CREATE INDEX IF NOT EXISTS idx_sourcing_group ON products(sourcing_group)",
            "CREATE INDEX IF NOT EXISTS idx_leaf_class ON products(leaf_class)",
            "CREATE INDEX IF NOT EXISTS idx_manufacturer ON products(manufacturer)",
        ]

        for idx_sql in indexes:
            cursor.execute(idx_sql)
            print(f"  ✅ Index created")

        conn.commit()

        # 기존 데이터 확인
        cursor.execute("SELECT COUNT(*) FROM products")
        count = cursor.fetchone()[0]

        print("\n" + "=" * 80)
        print(f"✅ 마이그레이션 완료! ({count}개 제품 데이터 유지)")
        print("=" * 80)

    except Exception as e:
        conn.rollback()
        print(f"\n❌ 마이그레이션 실패: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        conn.close()


if __name__ == "__main__":
    migrate()
