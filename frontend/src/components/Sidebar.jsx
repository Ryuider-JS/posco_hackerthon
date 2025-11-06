import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/', label: '홈', icon: '🏠' },
    { path: '/register', label: 'AI Q CODE 등록', icon: '📸' },
    { path: '/inventory', label: '실시간 재고현황', icon: '📹' },
    { path: '/products', label: '제품 목록', icon: '📋' },
  ];

  return (
    <div className="w-64 bg-gradient-to-b from-[#0d47a1] to-[#1565c0] min-h-screen text-white flex flex-col">
      {/* Logo Section */}
      <div className="p-6 text-center border-b border-blue-400">
        <h1 className="text-2xl font-bold mb-2">Q-ProcureAssistant</h1>
        <p className="text-sm text-blue-200">AI 구매 관리 시스템</p>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 py-6">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center px-6 py-4 text-lg transition-colors ${
              location.pathname === item.path
                ? 'bg-blue-700 border-l-4 border-white'
                : 'hover:bg-blue-600'
            }`}
          >
            <span className="mr-3 text-2xl">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 text-center text-sm text-blue-200 border-t border-blue-400">
        <p>© 2024 Q-CODE System</p>
      </div>
    </div>
  );
};

export default Sidebar;
