import { useState } from 'react';
import Header from '../components/Header';

const ProductRegister = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
    }
  };

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
      setResult(data);
    } catch (error) {
      console.error('Error:', error);
      alert('분석 중 오류가 발생했습니다.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRegisterNew = async () => {
    if (!result) return;

    try {
      // AI 분석 결과에서 제품 정보 추출 (간단하게)
      const response = await fetch('http://localhost:8000/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          name: '신규 제품',
          category: '미분류',
          description: result.ai_analysis.substring(0, 200),
          image_path: result.image_path,
        }),
      });

      const newProduct = await response.json();
      alert(`신규 제품 등록 완료!\nQ-CODE: ${newProduct.qcode}`);

      // 초기화
      setSelectedFile(null);
      setPreview(null);
      setResult(null);
    } catch (error) {
      console.error('Error:', error);
      alert('등록 중 오류가 발생했습니다.');
    }
  };

  const getSimilarityColor = (similarity) => {
    if (similarity >= 95) return 'bg-green-100 border-green-500';
    if (similarity >= 70) return 'bg-yellow-100 border-yellow-500';
    return 'bg-gray-100 border-gray-500';
  };

  const getSimilarityBadge = (similarity) => {
    if (similarity >= 95) return 'bg-green-500';
    if (similarity >= 70) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  return (
    <div>
      <Header
        title="Q CODE 자동 등록 시스템"
        subtitle="AI를 활용한 스마트 제품 등록"
      />

      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="max-w-4xl mx-auto">
          {/* Upload Area */}
          {!preview && (
            <div className="border-4 border-dashed border-blue-300 rounded-lg p-16 text-center bg-blue-50">
              <div className="text-6xl mb-6">📸</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">
                사진을 업로드하세요
              </h3>
              <p className="text-gray-600 mb-6">
                클릭하여 파일을 선택하거나 드래그 앤 드롭하세요
              </p>
              <label className="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors cursor-pointer inline-block">
                갤러리에서 선택
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Preview & Analyze */}
          {preview && !result && (
            <div className="space-y-6">
              <div className="border-2 border-gray-300 rounded-lg p-4">
                <img
                  src={preview}
                  alt="Preview"
                  className="max-w-full h-auto max-h-96 mx-auto rounded"
                />
              </div>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreview(null);
                  }}
                  className="bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                >
                  다시 선택
                </button>
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:bg-gray-400"
                >
                  {analyzing ? 'AI 분석 중...' : 'AI로 제품 분석하기'}
                </button>
              </div>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-6">
              {/* AI Analysis */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-3 flex items-center">
                  <span className="text-2xl mr-2">🔍</span>
                  AI 분석 결과
                </h3>
                <div className="bg-white rounded p-4 text-sm">
                  <pre className="whitespace-pre-wrap">{result.ai_analysis}</pre>
                </div>
              </div>

              {/* Similar Products */}
              {result.similar_products && result.similar_products.length > 0 ? (
                <div>
                  <h3 className="text-xl font-bold mb-4 flex items-center">
                    <span className="text-2xl mr-2">📦</span>
                    유사 제품 {result.similar_products.length}개 발견
                  </h3>
                  <div className="space-y-4">
                    {result.similar_products.map((product, index) => (
                      <div
                        key={product.id}
                        className={`border-2 rounded-lg p-6 ${getSimilarityColor(product.similarity)}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className={`${getSimilarityBadge(product.similarity)} text-white px-3 py-1 rounded-full text-sm font-bold`}>
                                {product.similarity >= 95 ? '✅ ' : product.similarity >= 70 ? '⚠️ ' : ''}
                                {product.similarity}% 일치
                              </span>
                              <span className="font-mono text-sm text-gray-600">
                                {product.qcode}
                              </span>
                            </div>
                            <h4 className="text-lg font-bold mb-2">{product.name}</h4>
                            <p className="text-sm text-gray-700 mb-3">{product.description}</p>
                            <div className="flex gap-4 text-sm text-gray-600">
                              <span>📦 구매이력: {product.purchase_count}회</span>
                              <span>⭐ 평점: {product.average_rating}</span>
                              <span>💰 최근 구매가: ₩{product.last_price.toLocaleString()}</span>
                            </div>
                          </div>
                          <button className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors ml-4">
                            이 제품 선택
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-8 text-center">
                  <div className="text-4xl mb-4">⚠️</div>
                  <h3 className="text-xl font-bold mb-2">유사 제품이 없습니다</h3>
                  <p className="text-gray-600 mb-6">신규 제품으로 등록하시겠습니까?</p>
                  <button
                    onClick={handleRegisterNew}
                    className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                  >
                    신규 제품으로 등록
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 justify-center pt-4">
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreview(null);
                    setResult(null);
                  }}
                  className="bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                >
                  새로운 제품 등록
                </button>
                {result.similar_products && result.similar_products.length > 0 && (
                  <button
                    onClick={handleRegisterNew}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                  >
                    그래도 신규 등록
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Tips */}
          {!result && (
            <div className="mt-8 flex items-start bg-yellow-50 p-4 rounded-lg">
              <span className="text-2xl mr-3">💡</span>
              <div>
                <p className="text-sm text-gray-700">
                  <strong>Tip:</strong> 명확한 제품명/모델명이 보이도록 촬영해주세요
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductRegister;
