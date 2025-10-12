import baseConfig from '@firsttimers/config/eslint';

export default [
  ...baseConfig,
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: new URL('.', import.meta.url).pathname
      }
    }
  }
];
