import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Handles incoming shares from the native share sheet.
 * Instagram passes the Reel URL in the 'url' param (sometimes 'text').
 * Immediately redirects to Home with the URL in router state.
 */
export default function ShareTarget() {
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sharedUrl = params.get('url') || params.get('text') || ''
    navigate('/', { state: { sharedUrl }, replace: true })
  }, [navigate])

  return <p>Opening Reel Eats…</p>
}
