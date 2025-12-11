import type { VercelRequest, VercelResponse } from '@vercel/node'
import app from '../src/index'

// Export the Express app as a serverless function
// This handler will be called for all routes matching /api/*
export default async (req: VercelRequest, res: VercelResponse) => {
  return app(req, res)
}

