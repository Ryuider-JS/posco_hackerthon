import { useState, useEffect } from 'react';
import Header from '../components/Header';
import ProductDetailModal from '../components/ProductDetailModal';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [manufacturerFilter, setManufacturerFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modal 상태
  const [selectedQcode, setSelectedQcode] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  // Debounced search (500ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, manufacturerFilter, categoryFilter]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // 쿼리 파라미터 구성
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (manufacturerFilter) params.append('manufacturer', manufacturerFilter);
      if (categoryFilter) params.append('category', categoryFilter);

      const url = `http://localhost:8000/api/products${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (qcode) => {
    setSelectedQcode(qcode);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedQcode(null);
  };

  // 제조사 목록 추출
  const manufacturers = [...new Set(products.map(p => p.manufacturer).filter(Boolean))];
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR');
  };

  return (
    <div>
      <Header
        title="제품 목록"
        subtitle="등록된 Q-CODE 제품 관리"
      />

      <div className="bg-white rounded-lg shadow-md p-8">
        {/* Search & Filter Bar */}
        <div className="mb-6 space-y-4">
          {/* 검색바 */}
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="제품명, 모델명, 제조사, 스펙, Q-CODE 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* 필터 */}
          <div className="flex gap-4">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">전체 카테고리</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={manufacturerFilter}
              onChange={(e) => setManufacturerFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">전체 제조사</option>
              {manufacturers.map(manu => (
                <option key={manu} value={manu}>{manu}</option>
              ))}
            </select>

            {(searchTerm || categoryFilter || manufacturerFilter) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('');
                  setManufacturerFilter('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 underline"
              >
                필터 초기화
              </button>
            )}
          </div>
        </div>

        {/* Products Table */}
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 w-32 whitespace-nowrap">Q-CODE</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 w-48 whitespace-nowrap">제품명</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 w-32 whitespace-nowrap">제조사</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 w-32 whitespace-nowrap">카테고리</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 w-24 whitespace-nowrap">구매이력</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 w-24 whitespace-nowrap">평점</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 w-28 whitespace-nowrap">등록일</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr className="border-b">
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    로딩 중...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr className="border-b">
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    {searchTerm ? '검색 결과가 없습니다' : '등록된 제품이 없습니다'}
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr
                    key={product.id}
                    onClick={() => handleCardClick(product.qcode)}
                    className="border-b hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap overflow-hidden text-ellipsis">
                      <span className="font-mono text-sm font-semibold text-purple-600">
                        {product.qcode}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium whitespace-nowrap overflow-hidden text-ellipsis" title={product.name}>
                      {product.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap overflow-hidden text-ellipsis" title={product.manufacturer || '-'}>
                      {product.manufacturer || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap overflow-hidden text-ellipsis" title={product.category}>
                      {product.category}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {product.purchase_count}회
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      <span className="text-yellow-500">⭐</span> {product.average_rating?.toFixed(1) || '0.0'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {formatDate(product.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        {!loading && products.length > 0 && (
          <div className="mt-6 text-sm text-gray-600">
            {searchTerm || categoryFilter || manufacturerFilter ? (
              <span>검색 결과: {products.length}개의 제품</span>
            ) : (
              <span>총 {products.length}개의 제품이 등록되어 있습니다.</span>
            )}
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      <ProductDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        qcode={selectedQcode}
      />
    </div>
  );
};

export default ProductList;
