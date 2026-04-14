import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import Home from './pages/Home.tsx'
import Recipes from './pages/Recipes.tsx'
import RecipeDetail from './pages/RecipeDetail.tsx'
import Profile from './pages/Profile.tsx'
import ShareTarget from './pages/ShareTarget.tsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/recipes" element={<Recipes />} />
        <Route path="/recipes/:id" element={<RecipeDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/share" element={<ShareTarget />} />
      </Routes>
    </BrowserRouter>
  )
}
