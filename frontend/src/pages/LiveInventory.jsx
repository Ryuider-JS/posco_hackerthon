import Header from '../components/Header';

const LiveInventory = () => {
  return (
    <div>
      <Header
        title="실시간 재고 현황"
        subtitle="웹캠을 통한 실시간 Q-CODE 감지"
      />

      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Webcam Area */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center">
              <div className="text-center text-gray-400">
                <div className="text-6xl mb-4">📹</div>
                <p className="text-xl">웹캠 피드</p>
                <p className="text-sm mt-2">웹캠 연결 대기 중...</p>
              </div>
            </div>
          </div>

          {/* Detection Results */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">감지된 제품</h3>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-gray-500">실시간 감지 결과가 여기에 표시됩니다</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveInventory;
