import '@jest/globals';

global.fetch = jest.fn();
global.Request = global.Request || jest.fn();
global.Response = global.Response || jest.fn();