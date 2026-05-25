import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LandingPage } from './components/pages/LandingPage';
import { EditorLayout } from './components/layout/EditorLayout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/editor" element={<EditorLayout />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
