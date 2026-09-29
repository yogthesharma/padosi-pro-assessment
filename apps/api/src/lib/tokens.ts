import jwt, { type SignOptions } from 'jsonwebtoken';

export interface TokenPayload {
  sub: string;
  /** Token version: bumped on logout so previously issued tokens stop working. */
  tv: number;
}

export interface TokenService {
  sign(payload: TokenPayload): { token: string; expiresAt: Date };
  verify(token: string): TokenPayload | null;
}

export function createJwtService(secret: string, expiresIn: string): TokenService {
  return {
    sign(payload) {
      const token = jwt.sign(payload, secret, {
        algorithm: 'HS256',
        expiresIn: expiresIn as SignOptions['expiresIn'],
      });
      const { exp } = jwt.decode(token) as { exp: number };
      return { token, expiresAt: new Date(exp * 1000) };
    },
    verify(token) {
      try {
        const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
        if (typeof decoded === 'string' || typeof decoded.sub !== 'string' || typeof decoded.tv !== 'number') {
          return null;
        }
        return { sub: decoded.sub, tv: decoded.tv };
      } catch {
        return null;
      }
    },
  };
}
