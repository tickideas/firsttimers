import { jest } from '@jest/globals';

jest.mock('next/router', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      reload: jest.fn(),
    };
  },
}));

jest.mock('next-auth/react', () => ({
  useSession() {
    return { data: null, status: 'loading' };
  },
  signIn: jest.fn(),
  signOut: jest.fn(),
}));