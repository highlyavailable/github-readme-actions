jest.mock('@actions/core', () => {
  const store = {};
  return {
    __setInput: (name, value) => {
      store[name] = value;
    },
    __reset: () => {
      for (const key of Object.keys(store)) delete store[key];
    },
    getInput: jest.fn((name) => store[name] || ''),
    setOutput: jest.fn(),
    setFailed: jest.fn(),
    info: jest.fn(),
    warning: jest.fn()
  };
});

jest.mock('@actions/github', () => ({
  context: { repo: { owner: 'octocat' } },
  getOctokit: jest.fn()
}));

const core = require('@actions/core');
const { loadConfig, validate, KNOWN_SECTIONS } = require('../src/config');

beforeEach(() => {
  core.__reset();
  delete process.env.GITHUB_TOKEN;
  delete process.env.INPUT_GITHUB_TOKEN;
});

describe('config', () => {
  test('loadConfig defaults', () => {
    core.__setInput('github_token', 'tok');
    core.__setInput('sections', 'open_prs,response_inbox');
    const cfg = loadConfig();
    expect(cfg.username).toBe('octocat');
    expect(cfg.targetFile).toBe('README.md');
    expect(cfg.sections).toEqual(['open_prs', 'response_inbox']);
    expect(cfg.shared.maxRows).toBe(10);
    expect(cfg.shared.includeDrafts).toBe(false);
  });

  test('validate rejects missing token', () => {
    core.__setInput('sections', 'open_prs');
    expect(() => validate(loadConfig())).toThrow(/github_token is required/);
  });

  test('validate rejects empty section list', () => {
    core.__setInput('github_token', 'tok');
    core.__setInput('sections', 'unknown_section');
    expect(() => validate(loadConfig())).toThrow(/sections is empty/);
  });

  test('all known sections are accepted', () => {
    core.__setInput('github_token', 'tok');
    core.__setInput('sections', KNOWN_SECTIONS.join(','));
    const cfg = loadConfig();
    expect(cfg.sections).toEqual(KNOWN_SECTIONS);
  });

  test('parses lists', () => {
    core.__setInput('github_token', 'tok');
    core.__setInput('sections', 'open_prs');
    core.__setInput('repositories', 'a/b , c/d');
    core.__setInput('exclude_repositories', 'e/f');
    const cfg = loadConfig();
    expect(cfg.shared.repositories).toEqual(['a/b', 'c/d']);
    expect(cfg.shared.excludeRepositories).toEqual(['e/f']);
  });

  test('parses booleans', () => {
    core.__setInput('github_token', 'tok');
    core.__setInput('sections', 'open_prs');
    core.__setInput('include_drafts', 'true');
    expect(loadConfig().shared.includeDrafts).toBe(true);
  });
});
