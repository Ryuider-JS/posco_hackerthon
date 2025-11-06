import { useState } from 'react';
import Header from '../components/Header';
import ProductDetailModal from '../components/ProductDetailModal';

const ProductRegister = () => {
  // 텍스트 검색 상태
  const [searchText, setSearchText] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState(null);

  // 이미지 업로드 상태
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [imageResult, setImageResult] = useState(null);

  // 텍스트 검색 핸들러
  const handleTextSearch = async () => {
    if (!searchText.trim()) {
      alert('검색어를 입력해주세요');
      return;
    }

    setSearchLoading(true);

    try {
      // GET /api/products 검색 API 활용
      const params = new URLSearchParams({ search: searchText });
      const response = await fetch(`http://localhost:8000/api/products?${params.toString()}`);
      const data = await response.json();

      // 검색 결과를 similar_products 형식으로 변환
      setSearchResult({
        success: true,
        similar_products: data.products || []
      });
      setImageResult(null); // 이미지 결과 초기화
    } catch (error) {
      console.error('Error:', error);
      alert('검색 중 오류가 발생했습니다.');
    } finally {
      setSearchLoading(false);
    }
  };

  // 이미지 선택 핸들러
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setImageResult(null);
      setSearchResult(null); // 텍스트 검색 결과 초기화
    }
  };

  // 이미지 분석 핸들러
  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setAnalyzing(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('http://localhost:8000/api/analyze-image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setImageResult(data);
      setSearchResult(null); // 텍스트 검색 결과 초기화
    } catch (error) {
      console.error('Error:', error);
      alert('분석 중 오류가 발생했습니다.');
    } finally {
      setAnalyzing(false);
    }
  };

  // 전체 초기화
  const handleReset = () => {
    setSearchText('');
    setSearchResult(null);
    setSelectedFile(null);
    setPreview(null);
    setImageResult(null);
  };

  // 상세 등록 폼 상태
  const [showDetailedForm, setShowDetailedForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    material: '',
    model_name: '',
    manufacturer: '',
    specs: '',
    n2b_product_code: '',
    attributes: [{ key: '', value: '' }],
  });

  // 상세 폼 입력 핸들러
  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // 속성 추가/수정/삭제
  const addAttribute = () => {
    setFormData(prev => ({
      ...prev,
      attributes: [...prev.attributes, { key: '', value: '' }]
    }));
  };

  const updateAttribute = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      attributes: prev.attributes.map((attr, i) =>
        i === index ? { ...attr, [field]: value } : attr
      )
    }));
  };

  const removeAttribute = (index) => {
    setFormData(prev => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== index)
    }));
  };

  // 신규 제품 등록 핸들러 (빠른 등록)
  const handleRegisterNew = async (analysisData, imagePath = null) => {
    try {
      const response = await fetch('http://localhost:8000/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          name: analysisData?.name || '신규 제품',
          category: analysisData?.category || '미분류',
          description: analysisData?.description || '신규 등록 제품',
          image_path: imagePath || '',
          material: analysisData?.material || '',
        }),
      });

      const newProduct = await response.json();
      alert(`신규 제품 등록 완료!\nQ-CODE: ${newProduct.qcode}`);

      // 초기화
      handleReset();
    } catch (error) {
      console.error('Error:', error);
      alert('등록 중 오류가 발생했습니다.');
    }
  };

  // 상세 정보 포함 등록 핸들러
  const handleDetailedRegister = async () => {
    if (!formData.name) {
      alert('제품명을 입력해주세요');
      return;
    }

    try {
      // attributes를 JSON으로 변환
      const attributesObj = {};
      formData.attributes.forEach(attr => {
        if (attr.key && attr.value) {
          attributesObj[attr.key] = attr.value;
        }
      });

      const response = await fetch('http://localhost:8000/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          name: formData.name,
          category: formData.category || '미분류',
          material: formData.material || '',
          model_name: formData.model_name || '',
          manufacturer: formData.manufacturer || '',
          specs: formData.specs || '',
          n2b_product_code: formData.n2b_product_code || '',
          attributes: JSON.stringify(attributesObj),
          image_path: isImageMode ? imageResult?.image_path : '',
        }),
      });

      const newProduct = await response.json();
      alert(`신규 제품 등록 완료!\nQ-CODE: ${newProduct.qcode}`);

      // 초기화
      setShowDetailedForm(false);
      setFormData({
        name: '',
        category: '',
        material: '',
        model_name: '',
        manufacturer: '',
        specs: '',
        n2b_product_code: '',
        attributes: [{ key: '', value: '' }],
      });
      handleReset();
    } catch (error) {
      console.error('Error:', error);
      alert('등록 중 오류가 발생했습니다.');
    }
  };


  // 현재 결과 (텍스트 또는 이미지)
  const currentResult = searchResult || imageResult;
  const isImageMode = !!imageResult;

  // 상세보기 모달 상태 추가
  const [selectedProductQcode, setSelectedProductQcode] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const handleProductClick = (qcode) => {
    setSelectedProductQcode(qcode);
    setIsDetailModalOpen(true);
  };

  // 유사 제품 표시 컴포넌트 - Google Material Design
  const SimilarProducts = ({ products }) => (
    <div>
      {products && products.length > 0 ? (
        <>
          <h3 className="text-base font-medium text-gray-900 mb-4">
            유사 제품 {products.length}개 발견
          </h3>
          <div className="space-y-3">
            {products.map((product) => (
              <div
                key={product.id}
                onClick={() => handleProductClick(product.qcode)}
                className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md hover:border-blue-400 transition-all cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  {product.image_path && (
                    <img
                      src={`http://localhost:8000/${product.image_path}`}
                      alt={product.name}
                      className="w-20 h-20 object-cover rounded border border-gray-200"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`${product.similarity >= 95 ? 'bg-green-100 text-green-800' : product.similarity >= 70 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'} px-2.5 py-0.5 rounded text-xs font-medium`}>
                        {product.similarity ? `${product.similarity}% 일치` : '검색 결과'}
                      </span>
                      <span className="text-xs text-gray-500 font-mono">
                        {product.qcode}
                      </span>
                    </div>
                    <h4 className="text-base font-medium text-gray-900 mb-1">{product.name}</h4>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-1">{product.description || '설명 없음'}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      {product.category && <span>카테고리: {product.category}</span>}
                      {product.manufacturer && <span>제조사: {product.manufacturer}</span>}
                      {product.material && <span>재질: {product.material}</span>}
                      {product.diameter && <span>직경: {product.diameter}</span>}
                      {product.length && <span>길이: {product.length}</span>}
                      <span>구매: {product.purchase_count || 0}회</span>
                      <span>평점: {product.average_rating || 0}</span>
                    </div>
                  </div>
                  <div className="text-blue-600 text-sm font-medium">
                    상세보기 →
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg border border-gray-300 p-8 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">유사 제품이 없습니다</h3>
          <p className="text-sm text-gray-600 mb-6">신규 제품으로 등록하시겠습니까?</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => handleRegisterNew(null, isImageMode ? imageResult?.image_path : null)}
              className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors shadow-sm"
            >
              빠른 등록
            </button>
            <button
              onClick={() => setShowDetailedForm(true)}
              className="px-6 py-2.5 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 transition-colors shadow-sm"
            >
              상세 정보 입력
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header
        title="AI Q-CODE"
        subtitle="텍스트 검색 또는 이미지 분석으로 제품 찾기"
      />

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* 검색 영역 */}
        <div className="space-y-4 mb-8">
          {/* 텍스트 검색 - Google Search 스타일 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex gap-3 items-start">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  제품 검색
                </label>
                <textarea
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="육각볼트 M10 스테인리스 / 강관 직경 100mm 길이 6m / 앵글 L형 50x50x5"
                  className="w-full h-20 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
              <button
                onClick={handleTextSearch}
                disabled={searchLoading || !searchText.trim()}
                className="mt-7 px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm"
              >
                {searchLoading ? '검색 중...' : '검색'}
              </button>
            </div>
          </div>

          {/* 이미지 업로드 - Material Design 스타일 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <label className="text-sm font-medium text-gray-700 mb-3 block">
              이미지로 검색
            </label>

            {!preview ? (
              <label className="block border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                <div className="flex items-center justify-center gap-3 text-gray-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-700">이미지 파일 선택</p>
                    <p className="text-xs text-gray-500 mt-1">JPG, PNG, WEBP 지원</p>
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="flex gap-4 items-center">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-24 h-24 object-cover rounded border border-gray-200"
                />
                <div className="flex-1 flex gap-2">
                  <button
                    onClick={handleAnalyze}
                    disabled={analyzing}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm"
                  >
                    {analyzing ? 'AI 분석 중...' : 'AI로 분석하기'}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setPreview(null);
                    }}
                    className="px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    취소
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 초기화 버튼 */}
        {(searchResult || imageResult) && (
          <div className="mb-4 flex justify-end">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors shadow-sm"
            >
              초기화
            </button>
          </div>
        )}

        {/* AI 분석 결과 */}
        {currentResult && currentResult.ai_analysis && (
          <div className="bg-white rounded-lg border border-blue-200 p-5 mb-6 shadow-sm">
            <h3 className="text-base font-medium text-gray-900 mb-3">
              AI 분석 결과
            </h3>
            <div className="bg-gray-50 rounded p-4 text-sm text-gray-700 border border-gray-200">
              <pre className="whitespace-pre-wrap font-sans">{currentResult.ai_analysis}</pre>
            </div>
          </div>
        )}

        {/* 검색 결과 */}
        {currentResult && (
          <div className="space-y-4">
            <SimilarProducts products={currentResult.similar_products} />

            {/* 신규 등록 버튼 (유사 제품이 있어도 표시) */}
            {currentResult.similar_products && currentResult.similar_products.length > 0 && (
              <div className="flex justify-center gap-4 pt-2">
                <button
                  onClick={() => handleRegisterNew(null, isImageMode ? imageResult?.image_path : null)}
                  className="px-6 py-2.5 text-sm font-medium text-blue-600 bg-white border border-blue-600 rounded hover:bg-blue-50 transition-colors shadow-sm"
                >
                  그래도 신규 제품으로 등록
                </button>
                <button
                  onClick={() => setShowDetailedForm(true)}
                  className="px-6 py-2.5 text-sm font-medium text-green-600 bg-white border border-green-600 rounded hover:bg-green-50 transition-colors shadow-sm"
                >
                  상세 정보 입력
                </button>
              </div>
            )}
          </div>
        )}

        {/* 사용 안내 */}
        {!searchResult && !imageResult && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
            <p className="text-sm text-gray-700">
              <span className="font-medium">💡 Tip:</span> 텍스트로는 "육각볼트 M10 스테인리스" 같이 검색하고, 이미지는 제품명/규격이 명확하게 보이도록 촬영하세요.
            </p>
          </div>
        )}
      </div>

      {/* 상세 등록 폼 Modal */}
      {showDetailedForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={(e) => {
          if (e.target === e.currentTarget) setShowDetailedForm(false);
        }}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto mx-4">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">상세 제품 정보 입력</h2>
              <button onClick={() => setShowDetailedForm(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">제품명 *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="제품명 입력"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => handleFormChange('category', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 기계/기구/공구"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">제조사</label>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) => handleFormChange('manufacturer', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="제조사명"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">모델명</label>
                  <input
                    type="text"
                    value={formData.model_name}
                    onChange={(e) => handleFormChange('model_name', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="모델명"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">재질</label>
                  <input
                    type="text"
                    value={formData.material}
                    onChange={(e) => handleFormChange('material', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: STS304"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">엔투비품번</label>
                  <input
                    type="text"
                    value={formData.n2b_product_code}
                    onChange={(e) => handleFormChange('n2b_product_code', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="엔투비품번"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">상세 스펙</label>
                <textarea
                  value={formData.specs}
                  onChange={(e) => handleFormChange('specs', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 육각볼트,M12x50,STS304,KS B 1002"
                />
              </div>

              {/* 개별 속성 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">개별 속성</label>
                <div className="space-y-3">
                  {formData.attributes.map((attr, index) => (
                    <div key={index} className="flex gap-3">
                      <input
                        type="text"
                        value={attr.key}
                        onChange={(e) => updateAttribute(index, 'key', e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="속성명 (예: 규격)"
                      />
                      <input
                        type="text"
                        value={attr.value}
                        onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="값 (예: M12)"
                      />
                      <button
                        onClick={() => removeAttribute(index)}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={addAttribute}
                  className="mt-3 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  + 속성 추가
                </button>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end gap-4">
              <button
                onClick={() => setShowDetailedForm(false)}
                className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                취소
              </button>
              <button
                onClick={handleDetailedRegister}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                등록하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      <ProductDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        qcode={selectedProductQcode}
      />
    </div>
  );
};

export default ProductRegister;
