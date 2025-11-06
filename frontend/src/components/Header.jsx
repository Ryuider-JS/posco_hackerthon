const Header = ({ title, subtitle }) => {
  return (
    <div className="bg-gradient-to-r from-[#7c4dff] to-[#9c27b0] text-white p-8 rounded-lg mb-6 shadow-lg">
      <div className="flex items-center justify-center">
        <span className="text-4xl mr-4">📸</span>
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-purple-100 mt-2">{subtitle}</p>
        </div>
      </div>
    </div>
  );
};

export default Header;
