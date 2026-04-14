import express, { Request, Response, NextFunction } from 'express'
import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import { pinoHttp } from 'pino-http'
import { logger } from './lib/logger.js'
import { router } from './routes/index.js'

const app = express()

// Trust Railway's proxy so rate limiting and IP detection work correctly
app.set('trust proxy', 1)

// Security headers
app.use(helmet())

// Request logging — never log auth headers
app.use(pinoHttp({ logger, redact: ['req.headers.authorization'] }))

// CORS — locked to exact origin, no wildcard
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }))

// Body parsing
app.use(express.json())

// Rate limiting
// 100 req / 15 min per IP — all routes
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
  })
)
// 5 req / 15 min per IP — auth routes
app.use(
  '/api/auth',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { code: 'RATE_LIMITED', message: 'Too many auth attempts' } },
  })
)

// API routes
app.use('/api', router)

// Health check — unauthenticated, no rate limit
app.get('/health', (_req: Request, res: Response) => {
  res.json({ data: { status: 'ok' } })
})

// 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } })
})

// Global error handler — never expose stack traces to clients
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, 'Unhandled error')
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } })
})

export { app }
