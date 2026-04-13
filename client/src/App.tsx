import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home.tsx'
import ShareTarget from './pages/ShareTarget.tsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/share" element={<ShareTarget />} />
      </Routes>
    </BrowserRouter>
  )
}
