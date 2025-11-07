import Header from '../components/Header';

const Home = () => {
  return (
    <div>
      <Header
        title="Q CODE 자동 등록 시스템"
        subtitle="AI를 활용한 스마트 제품 등록"
      />

      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center py-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            환영합니다!
          </h2>
          <p className="text-gray-600 text-lg mb-8">
            Q-ProcureAssistant는 AI 기반 구매 관리 시스템입니다
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="p-6 bg-blue-50 rounded-lg">
              <div className="text-4xl mb-4">📸</div>
              <h3 className="text-xl font-semibold mb-2">AI Q CODE 등록</h3>
              <p className="text-gray-600">
                사진으로 간편하게 제품을 검색하고<br />
                AI가 자동으로 매칭합니다
              </p>
            </div>

            <div className="p-6 bg-purple-50 rounded-lg">
              <div className="text-4xl mb-4">📹</div>
              <h3 className="text-xl font-semibold mb-2">실시간 재고현황</h3>
              <p className="text-gray-600">
                CCTV로 실시간 재고를<br />
                파악하고 관리합니다
              </p>
            </div>

            <div className="p-6 bg-green-50 rounded-lg">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-xl font-semibold mb-2">제품 목록</h3>
              <p className="text-gray-600">
                등록된 모든 제품을<br />
                확인하고 관리합니다
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
