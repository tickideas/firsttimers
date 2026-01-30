import crypto from 'crypto';

export const generateVerificationCode = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

export const generateExpiryTime = (minutes: number = 10): Date => {
  return new Date(Date.now() + minutes * 60 * 1000);
};

export const isValidVerificationCode = (code: string): boolean => {
  return /^\d{6}$/.test(code);
};