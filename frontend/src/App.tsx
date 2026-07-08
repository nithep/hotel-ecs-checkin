import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Scan from './pages/Scan';
import Presentation from './pages/Presentation';
import Manual from './pages/Manual';
import GuestView from './pages/GuestView';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/guest" element={<GuestView />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Presentation />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="scan" element={<Scan />} />
          <Route path="manual" element={<Manual />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
