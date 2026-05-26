import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LandingPage } from './components/pages/LandingPage';
import { EditorLayout } from './components/layout/EditorLayout';
import { BrowserSourceView } from './components/pages/BrowserSourceView';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/editor" element={<EditorLayout />} />
        <Route path="/o/:overlayCode" element={<BrowserSourceView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
