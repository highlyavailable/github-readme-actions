const { main } = require('../index.js');

// Mock the @actions/core module
jest.mock('@actions/core', () => ({
  getInput: jest.fn(),
  setOutput: jest.fn(),
  setFailed: jest.fn(),
  info: jest.fn(),
  warning: jest.fn()
}));

// Mock the @actions/github module
jest.mock('@actions/github', () => ({
  context: {
    repo: {
      owner: 'testuser'
    }
  },
  getOctokit: jest.fn()
}));

// Mock fs module
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  writeFileSync: jest.fn()
}));

describe('GitHub Pinned PR Readme', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set default environment
    process.env.GITHUB_ACTIONS = '';
  });

  test('should export main function', () => {
    expect(typeof main).toBe('function');
  });

  test('should handle missing GITHUB_TOKEN', async () => {
    const core = require('@actions/core');
    core.getInput.mockReturnValue('');
    process.env.GITHUB_TOKEN = '';

    await main();

    expect(core.setFailed).toHaveBeenCalledWith('GITHUB_TOKEN is required');
  });
}); 