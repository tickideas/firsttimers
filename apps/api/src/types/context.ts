import type { JwtPayload } from '../types/jwt.js';

export type AppBindings = {
  Variables: {
    requestId: string;
    authUser?: JwtPayload;
  };
};
