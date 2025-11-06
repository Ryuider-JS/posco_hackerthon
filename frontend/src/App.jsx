import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import ProductRegister from './pages/ProductRegister';
import LiveInventory from './pages/LiveInventory';
import ProductList from './pages/ProductList';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="register" element={<ProductRegister />} />
          <Route path="inventory" element={<LiveInventory />} />
          <Route path="products" element={<ProductList />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
