// File: apps/api/src/__tests__/setup.ts
// Description: Test preload that sets safe environment defaults before app modules load
// Why: config/env.ts validates process.env at import time (JWT_SECRET min 32 chars, etc.),
//      so tests importing any app module need deterministic env values available first
// RELEVANT FILES: apps/api/bunfig.toml, apps/api/src/config/env.ts, apps/api/src/services/jwt.ts

process.env.NODE_ENV ||= 'test'
process.env.JWT_SECRET ||= 'test-jwt-secret-with-at-least-32-characters'
process.env.JWT_EXPIRES_IN ||= '15m'
process.env.REFRESH_TOKEN_EXPIRES_IN ||= '7d'
process.env.DATABASE_URL ||= 'postgresql://postgres:postgres@localhost:5432/firsttimers_test'
process.env.REDIS_URL ||= 'redis://localhost:6379'
