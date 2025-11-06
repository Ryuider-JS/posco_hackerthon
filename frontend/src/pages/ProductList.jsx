import { useState, useEffect } from 'react';
import Header from '../components/Header';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.qcode.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        {/* Search Bar */}
        <div className="mb-6 flex gap-4">
          <input
            type="text"
            placeholder="제품명 또는 Q-CODE 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors">
            검색
          </button>
        </div>

        {/* Products Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Q-CODE</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">제품명</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">카테고리</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">구매이력</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">평점</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">등록일</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr className="border-b">
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    로딩 중...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr className="border-b">
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    {searchTerm ? '검색 결과가 없습니다' : '등록된 제품이 없습니다'}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-semibold text-purple-600">
                        {product.qcode}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">{product.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{product.category}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {product.purchase_count}회
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="text-yellow-500">⭐</span> {product.average_rating}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(product.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        {!loading && filteredProducts.length > 0 && (
          <div className="mt-6 text-sm text-gray-600">
            총 {filteredProducts.length}개의 제품이 등록되어 있습니다.
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductList;
