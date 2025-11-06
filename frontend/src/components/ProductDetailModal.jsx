import { useState, useEffect } from 'react';

/**
 * 제품 상세 정보 팝업 모달
 * 4개 탭: 기본정보 / 상세스펙 / 구매정보 / 재고현황
 */
export default function ProductDetailModal({ isOpen, onClose, qcode }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    if (isOpen && qcode) {
      fetchProductDetail();
    }
  }, [isOpen, qcode]);

  const fetchProductDetail = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/products/${qcode}`);
      const data = await response.json();
      setProduct(data);
    } catch (error) {
      console.error('제품 정보 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // attributes JSON 파싱
  const parseAttributes = () => {
    if (!product?.attributes) return [];
    try {
      const attrs = typeof product.attributes === 'string'
        ? JSON.parse(product.attributes)
        : product.attributes;
      return Object.entries(attrs);
    } catch {
      return [];
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[85vh] flex flex-col mx-4">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex justify-between items-center flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-800">제품 상세 정보</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">로딩 중...</p>
            </div>
          </div>
        ) : product ? (
          <>
            {/* Tabs */}
            <div className="border-b px-6 flex-shrink-0">
              <div className="flex space-x-8">
                {[
                  { id: 'basic', label: '기본정보' },
                  { id: 'specs', label: '상세스펙' },
                  { id: 'purchase', label: '구매정보' },
                  { id: 'inventory', label: '재고현황' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-3 px-2 border-b-2 font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content - 고정 높이 스크롤 영역 */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* 기본정보 탭 */}
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  {product.image_path && (
                    <div className="flex justify-center">
                      <img
                        src={`http://localhost:8000/${product.image_path}`}
                        alt={product.name}
                        className="w-64 h-64 object-cover rounded-lg shadow-md"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/256x256?text=No+Image';
                        }}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-6">
                    <InfoRow label="Q-CODE" value={product.qcode} />
                    <InfoRow label="제품명" value={product.name} />
                    <InfoRow label="표준품명" value={product.standard_name} />
                    <InfoRow label="카테고리" value={product.category} />
                    <InfoRow label="제조사" value={product.manufacturer} />
                    <InfoRow label="모델명" value={product.model_name} />
                    <InfoRow label="엔투비품번" value={product.n2b_product_code} />
                    <InfoRow label="표준소싱그룹" value={product.sourcing_group} />
                    <InfoRow label="리프클래스" value={product.leaf_class} />
                  </div>

                  {product.description && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">설명</p>
                      <p className="text-gray-800 bg-gray-50 p-4 rounded">{product.description}</p>
                    </div>
                  )}
                </div>
              )}

              {/* 상세스펙 탭 */}
              {activeTab === 'specs' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <InfoRow label="직경" value={product.diameter} />
                    <InfoRow label="길이" value={product.length} />
                    <InfoRow label="재질" value={product.material} />
                  </div>

                  {product.specs && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">엔투비사양</p>
                      <p className="text-gray-800 bg-blue-50 p-4 rounded border border-blue-200">
                        {product.specs}
                      </p>
                    </div>
                  )}

                  {/* 개별속성 테이블 */}
                  {parseAttributes().length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">개별 속성</p>
                      <table className="w-full border border-gray-300">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-700">
                              속성명
                            </th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-700">
                              값
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {parseAttributes().map(([key, value], index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 text-gray-700 font-medium">
                                {key}
                              </td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-800">
                                {value}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* 구매정보 탭 */}
              {activeTab === 'purchase' && (
                <div className="space-y-6">
                  {/* 구매 예측 정보 - 하이라이트 */}
                  {product.next_predicted_purchase_date && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border-2 border-blue-300">
                      <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                        <span className="text-2xl mr-2">🔮</span>
                        구매 예측 정보
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-blue-700 mb-1">최근 주문일</p>
                          <p className="text-lg font-semibold text-blue-900">
                            {product.last_order_date
                              ? new Date(product.last_order_date).toLocaleDateString('ko-KR')
                              : '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-blue-700 mb-1">예상 다음 구매일</p>
                          <p className="text-xl font-bold text-indigo-600">
                            {new Date(product.next_predicted_purchase_date).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-blue-700 mb-1">평균 구매 간격</p>
                          <p className="text-lg font-semibold text-blue-900">
                            {product.avg_purchase_interval_days
                              ? `${Math.round(product.avg_purchase_interval_days)}일`
                              : '-'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 구매 이력 */}
                  <div className="grid grid-cols-3 gap-6">
                    <div className="bg-white p-4 rounded-lg border shadow-sm">
                      <p className="text-sm text-gray-600 mb-1">구매 횟수</p>
                      <p className="text-2xl font-bold text-gray-900">{product.purchase_count || 0}회</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border shadow-sm">
                      <p className="text-sm text-gray-600 mb-1">평균 평점</p>
                      <p className="text-2xl font-bold text-yellow-500">
                        ⭐ {product.average_rating?.toFixed(1) || '0.0'}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border shadow-sm">
                      <p className="text-sm text-gray-600 mb-1">최근 가격</p>
                      <p className="text-2xl font-bold text-green-600">
                        {product.last_price ? `₩${product.last_price.toLocaleString()}` : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 재고현황 탭 */}
              {activeTab === 'inventory' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-700 mb-2">현재 재고</p>
                      <p className="text-3xl font-bold text-blue-900">
                        {product.current_stock} {product.stock_unit || '개'}
                      </p>
                    </div>
                    <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
                      <p className="text-sm text-orange-700 mb-2">재주문 시점</p>
                      <p className="text-3xl font-bold text-orange-900">
                        {product.reorder_point} {product.stock_unit || '개'}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-700 mb-2">최소 재고</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {product.min_stock} {product.stock_unit || '개'}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-700 mb-2">최대 재고</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {product.max_stock} {product.stock_unit || '개'}
                      </p>
                    </div>
                  </div>

                  {/* 재고 상태 */}
                  <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <p className="text-sm text-gray-600 mb-3">재고 상태</p>
                    <div className="flex items-center space-x-4">
                      {product.current_stock <= product.reorder_point ? (
                        <span className="px-4 py-2 bg-red-100 text-red-700 rounded-full font-semibold">
                          ⚠️ 재주문 필요
                        </span>
                      ) : product.current_stock <= product.min_stock ? (
                        <span className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-full font-semibold">
                          ⚡ 재고 부족
                        </span>
                      ) : (
                        <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full font-semibold">
                          ✅ 정상
                        </span>
                      )}

                      {product.low_stock_alert && (
                        <span className="text-sm text-gray-600">재고 부족 알림 활성화됨</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-600">제품 정보를 찾을 수 없습니다.</div>
        )}

        {/* Footer */}
        <div className="bg-gray-50 border-t px-6 py-4 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * InfoRow 헬퍼 컴포넌트
 */
function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
      <p className="text-gray-900 font-medium">{value || '-'}</p>
    </div>
  );
}
