import bcrypt from 'bcryptjs';

export const hashPassword = async (password: string) => bcrypt.hash(password, 12);

export const verifyPassword = async (password: string, hashed?: string | null) => {
  if (!hashed) return false;
  return bcrypt.compare(password, hashed);
};
