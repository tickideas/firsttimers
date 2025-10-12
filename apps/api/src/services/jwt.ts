import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

import { env } from '../config/env.js';
import type { JwtPayload } from '../types/jwt.js';

const secret = new TextEncoder().encode(env.JWT_SECRET);
const issuer = 'firsttimers-api';
const audience = 'firsttimers-admin';

const signToken = async (payload: JwtPayload | JWTPayload, expiresIn: string) =>
  new SignJWT(payload as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(issuer)
    .setAudience(audience)
    .setExpirationTime(expiresIn)
    .sign(secret);

export const signAccessToken = (payload: JwtPayload) => signToken(payload, env.JWT_EXPIRES_IN);

export const signRefreshToken = (payload: JwtPayload) => signToken(payload, env.REFRESH_TOKEN_EXPIRES_IN);

export const verifyJwt = async <T extends JWTPayload = JwtPayload>(token: string) => {
  const { payload } = await jwtVerify(token, secret, { issuer, audience });
  return payload as T;
};
