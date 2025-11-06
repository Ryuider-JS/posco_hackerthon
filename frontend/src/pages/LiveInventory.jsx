import { useRef, useEffect, useState } from 'react';
import Header from '../components/Header';

const LiveInventory = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // 상태 관리
  const [detectedProducts, setDetectedProducts] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanInterval, setScanInterval] = useState(null);
  const [webcamError, setWebcamError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentInventory, setCurrentInventory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [availableDevices, setAvailableDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);

  // 사용 가능한 카메라 목록 가져오기
  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setAvailableDevices(videoDevices);

        // 기본 카메라 선택 (첫 번째 장치)
        if (videoDevices.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(videoDevices[0].deviceId);
        }
      } catch (error) {
        console.error('카메라 목록 가져오기 실패:', error);
      }
    };

    getDevices();
  }, []);

  // 웹캠 시작
  useEffect(() => {
    const startWebcam = async () => {
      try {
        // 기존 스트림 정리
        if (videoRef.current && videoRef.current.srcObject) {
          const tracks = videoRef.current.srcObject.getTracks();
          tracks.forEach(track => track.stop());
        }

        const constraints = {
          video: selectedDeviceId
            ? { deviceId: { exact: selectedDeviceId }, width: 1280, height: 720 }
            : { width: 1280, height: 720 }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setWebcamError(null);
        }
      } catch (error) {
        console.error('웹캠 시작 실패:', error);
        setWebcamError('웹캠에 접근할 수 없습니다. 권한을 확인해주세요.');
      }
    };

    if (selectedDeviceId) {
      startWebcam();
    }

    // 컴포넌트 언마운트 시 웹캠 정리
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
      if (scanInterval) {
        clearInterval(scanInterval);
      }
    };
  }, [selectedDeviceId]);

  // 재고 현황 및 알림 주기적으로 가져오기
  useEffect(() => {
    fetchCurrentInventory();
    fetchAlerts();

    const interval = setInterval(() => {
      fetchCurrentInventory();
      fetchAlerts();
    }, 10000); // 10초마다

    return () => clearInterval(interval);
  }, []);

  // 현재 재고 현황 조회
  const fetchCurrentInventory = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/inventory/current');
      const data = await response.json();
      setCurrentInventory(data.products || []);
    } catch (error) {
      console.error('재고 현황 조회 실패:', error);
    }
  };

  // 재고 부족 알림 조회
  const fetchAlerts = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/inventory/alerts');
      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error('알림 조회 실패:', error);
    }
  };

  // 바운딩 박스 그리기
  const drawBoundingBoxes = (canvas, predictions) => {
    const ctx = canvas.getContext('2d');

    // 각 예측에 대해 바운딩 박스 그리기
    predictions.forEach((pred) => {
      const x = pred.x - pred.width / 2;
      const y = pred.y - pred.height / 2;
      const width = pred.width;
      const height = pred.height;

      // 박스 그리기
      ctx.strokeStyle = '#00ff00'; // 초록색
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, width, height);

      // 라벨 배경
      const label = `${pred.class} ${(pred.confidence * 100).toFixed(0)}%`;
      ctx.font = '16px Arial';
      const textWidth = ctx.measureText(label).width;

      ctx.fillStyle = '#00ff00';
      ctx.fillRect(x, y - 25, textWidth + 10, 25);

      // 라벨 텍스트
      ctx.fillStyle = '#000000';
      ctx.fillText(label, x + 5, y - 7);
    });
  };

  // 프레임 캡처 및 Q-CODE 감지 (다중 제품 지원)
  const captureAndDetect = async () => {
    if (!videoRef.current || isProcessing) return;

    console.log('[LiveInventory] 프레임 캡처 시작...');
    setIsProcessing(true);

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      // Canvas 크기 설정 (한 번만)
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      // 임시 Canvas 생성 (API 전송용)
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = video.videoWidth;
      tempCanvas.height = video.videoHeight;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);

      console.log('[LiveInventory] Canvas에 프레임 그리기 완료');

      // 임시 Canvas를 Blob으로 변환
      tempCanvas.toBlob(async (blob) => {
        if (!blob) {
          console.error('[LiveInventory] Blob 생성 실패');
          setIsProcessing(false);
          return;
        }

        console.log('[LiveInventory] Blob 생성 완료, API 호출 중...');
        const formData = new FormData();
        formData.append('file', blob, 'frame.jpg');

        try {
          // 백엔드 API 호출 (새 엔드포인트: 다중 제품 지원)
          console.log('[LiveInventory] API URL: http://localhost:8000/api/detect-qcode');
          const response = await fetch('http://localhost:8000/api/detect-qcode', {
            method: 'POST',
            body: formData
          });

          console.log('[LiveInventory] API 응답 수신:', response.status);

          const data = await response.json();
          console.log('[LiveInventory] API 응답 데이터:', data);

          // 바운딩 박스 그리기 (새 결과로 업데이트)
          if (data.raw_predictions && data.raw_predictions.length > 0) {
            console.log('[LiveInventory] 바운딩 박스 그리기:', data.raw_predictions.length, '개');
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height); // 이전 박스 지우기
            drawBoundingBoxes(canvas, data.raw_predictions); // 새 박스 그리기
          } else {
            // 감지된 것이 없으면 기존 박스 유지 (clearRect 하지 않음)
            console.log('[LiveInventory] 감지 없음, 기존 박스 유지');
          }

          if (data.success && data.detected_products && data.detected_products.length > 0) {
            console.log('[LiveInventory] 제품 감지됨:', data.detected_products.length, '개');
            // 감지된 제품들을 감지 이력에 추가
            const now = new Date();
            const newDetections = data.detected_products.map(product => ({
              ...product,
              detectedAt: now,
              count: product.detected_count || 0,
              confidence: product.confidence || 0
            }));

            setDetectedProducts(prev => [...newDetections, ...prev].slice(0, 50)); // 최대 50개 유지

            // 재고 현황 갱신
            fetchCurrentInventory();
            fetchAlerts();
          } else {
            console.log('[LiveInventory] 감지된 제품 없음 또는 실패:', data);
          }
        } catch (error) {
          console.error('[LiveInventory] Q-CODE 감지 API 호출 실패:', error);
        } finally {
          setIsProcessing(false);
        }
      }, 'image/jpeg', 0.8);
    } catch (error) {
      console.error('프레임 캡처 실패:', error);
      setIsProcessing(false);
    }
  };

  // 스캔 시작
  const startScanning = () => {
    if (isScanning) return;

    setIsScanning(true);
    setDetectedProducts([]);

    // 3초마다 프레임 캡처 및 감지 (Gemini 응답 시간 고려)
    const interval = setInterval(() => {
      captureAndDetect();
    }, 3000);

    setScanInterval(interval);
  };

  // 스캔 중지
  const stopScanning = () => {
    if (scanInterval) {
      clearInterval(scanInterval);
      setScanInterval(null);
    }
    setIsScanning(false);
    setIsProcessing(false);
  };

  // 감지 목록 초기화
  const clearDetections = () => {
    setDetectedProducts([]);
  };

  // 스냅샷 캡처 (사진 찍기)
  const captureSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;

    // Canvas 크기 설정
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // 비디오 프레임을 Canvas에 그리기
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Canvas를 Blob으로 변환하여 다운로드
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        link.download = `qcode-snapshot-${timestamp}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);

        // 성공 알림 (선택사항)
        alert('스냅샷이 저장되었습니다!');
      }
    }, 'image/png');
  };

  // 재고 상태 색상
  const getStockStatusColor = (status) => {
    switch (status) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-500';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-500';
      case 'safe':
        return 'bg-green-100 text-green-800 border-green-500';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-500';
    }
  };

  // 재고 상태 아이콘
  const getStockStatusIcon = (status) => {
    switch (status) {
      case 'critical':
        return '🔴';
      case 'warning':
        return '🟡';
      case 'safe':
        return '🟢';
      default:
        return '⚪';
    }
  };

  return (
    <div>
      <Header
        title="실시간 재고 현황"
        subtitle="웹캠을 통한 실시간 제품 감지 및 재고 추적"
      />

      <div className="bg-white rounded-lg shadow-md p-8">
        {/* 카메라 선택 및 컨트롤 */}
        <div className="mb-6 flex items-center gap-4">
          {/* 카메라 선택 드롭다운 */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">
              카메라 선택:
            </label>
            <select
              value={selectedDeviceId || ''}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableDevices.map((device, index) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `카메라 ${index + 1}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 컨트롤 버튼 */}
        <div className="mb-6 flex gap-4 flex-wrap">
          {!isScanning ? (
            <button
              onClick={startScanning}
              disabled={webcamError}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition-colors"
            >
              🔍 스캔 시작
            </button>
          ) : (
            <button
              onClick={stopScanning}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-colors"
            >
              ⏹ 스캔 중지
            </button>
          )}

          <button
            onClick={clearDetections}
            disabled={detectedProducts.length === 0}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
          >
            🗑 감지 이력 초기화
          </button>

          <button
            onClick={captureSnapshot}
            disabled={webcamError}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition-colors"
          >
            📸 사진 찍기
          </button>

          {isScanning && (
            <div className="flex items-center gap-2 px-4 py-3 bg-green-100 text-green-800 rounded-lg">
              <div className="animate-pulse">●</div>
              <span className="font-semibold">스캔 중...</span>
            </div>
          )}

          {isProcessing && (
            <div className="flex items-center gap-2 px-4 py-3 bg-yellow-100 text-yellow-800 rounded-lg">
              <div className="animate-spin">⟳</div>
              <span className="font-semibold">처리 중...</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Webcam Area */}
          <div>
            <div className="bg-gray-900 rounded-lg overflow-hidden relative">
              {webcamError ? (
                <div className="aspect-video flex items-center justify-center">
                  <div className="text-center text-red-400">
                    <div className="text-6xl mb-4">⚠️</div>
                    <p className="text-xl">{webcamError}</p>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-auto"
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full pointer-events-none"
                    style={{ zIndex: 10 }}
                  />

                  {/* 스캔 오버레이 */}
                  {isScanning && (
                    <div className="absolute inset-0 border-4 border-green-500 animate-pulse pointer-events-none" style={{ zIndex: 5 }} />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 재고 부족 알림 */}
          {alerts.length > 0 && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4 text-red-800 flex items-center gap-2">
                <span>⚠️ 재고 부족 알림</span>
                <span className="text-sm font-normal bg-red-200 px-3 py-1 rounded-full">
                  {alerts.length}건
                </span>
              </h3>

              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.qcode}
                    className={`p-4 rounded-lg border-l-4 ${
                      alert.status === 'critical'
                        ? 'bg-red-100 border-red-500'
                        : 'bg-yellow-100 border-yellow-500'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-lg">
                          {getStockStatusIcon(alert.status)} {alert.product_name}
                        </p>
                        <p className="text-sm text-gray-600">Q-CODE: {alert.qcode}</p>
                        <p className="text-sm mt-2">
                          현재 재고: <strong>{alert.current_stock}</strong>{alert.stock_unit} /
                          최소: {alert.min_stock}{alert.stock_unit}
                        </p>
                        {!alert.insufficient_data && (
                          <p className="text-sm mt-1 font-semibold text-red-700">
                            {alert.status === 'critical' ? '⛔ 긴급 구매 필요' : '⚠️ '}
                            {Math.ceil(alert.days_until_reorder)}일 후 재주문 필요
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 현재 재고 현황 테이블 */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center justify-between">
              <span>📦 현재 재고 현황</span>
              <span className="text-sm font-normal text-gray-600">
                {currentInventory.length}개 제품
              </span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">상태</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">제품명</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Q-CODE</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">현재 수량</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">재주문 시점</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">최소 재고</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentInventory.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                        등록된 제품이 없습니다
                      </td>
                    </tr>
                  ) : (
                    currentInventory.map((product) => (
                      <tr key={product.qcode} className="hover:bg-gray-100">
                        <td className="px-4 py-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStockStatusColor(product.stock_status)}`}>
                            {getStockStatusIcon(product.stock_status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium">{product.name}</td>
                        <td className="px-4 py-3 font-mono text-sm text-blue-600">{product.qcode}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-bold text-lg">{product.current_stock}</span>
                          <span className="text-sm text-gray-600 ml-1">{product.stock_unit}</span>
                        </td>
                        <td className="px-4 py-3 text-right text-yellow-700">
                          {product.reorder_point}{product.stock_unit}
                        </td>
                        <td className="px-4 py-3 text-right text-red-700">
                          {product.min_stock}{product.stock_unit}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 감지 이력 */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center justify-between">
              <span>📋 감지 이력</span>
              <span className="text-sm font-normal text-gray-600">
                {detectedProducts.length}건
              </span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">시간</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">제품명</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Q-CODE</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">감지 수량</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">신뢰도</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {detectedProducts.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                        {isScanning
                          ? '제품을 스캔하는 중입니다...'
                          : '스캔을 시작하면 감지된 제품이 표시됩니다'}
                      </td>
                    </tr>
                  ) : (
                    detectedProducts.map((product, index) => (
                      <tr key={`${product.qcode}-${index}`} className="hover:bg-gray-100">
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {product.detectedAt?.toLocaleTimeString('ko-KR')}
                        </td>
                        <td className="px-4 py-3 font-medium">{product.name}</td>
                        <td className="px-4 py-3 font-mono text-sm text-blue-600">
                          {product.qcode}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-bold text-lg text-green-600">
                            {product.count}
                          </span>
                          <span className="text-sm text-gray-600 ml-1">{product.stock_unit}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm text-gray-700">
                            {(product.confidence * 100).toFixed(0)}%
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveInventory;
