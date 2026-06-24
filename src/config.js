const core = require('@actions/core');
const github = require('@actions/github');

const KNOWN_SECTIONS = [
  'open_prs',
  'response_inbox',
  'review_inbox',
  'recent_activity',
  'activity_feed',
  'merged_prs',
  'stats',
  'pinned_prs',
  'stale_prs',
  'failing_ci',
  'ready_to_merge',
  'velocity_chart',
  'commit_heatmap',
  'streak',
  'command_center'
];

function readBool(name, fallback) {
  const raw = core.getInput(name);
  if (raw === '' || raw === undefined) return fallback;
  return raw.toLowerCase() === 'true';
}

function readInt(name, fallback) {
  const raw = core.getInput(name);
  if (!raw) return fallback;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

function readList(name) {
  const raw = core.getInput(name);
  if (!raw) return [];
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

function readSections() {
  const list = readList('sections');
  const unknown = list.filter((s) => !KNOWN_SECTIONS.includes(s));
  if (unknown.length) {
    core.warning(`Ignoring unknown sections: ${unknown.join(', ')}. Known: ${KNOWN_SECTIONS.join(', ')}.`);
  }
  return list.filter((s) => KNOWN_SECTIONS.includes(s));
}

function readToken() {
  return (
    core.getInput('github_token') ||
    process.env.GITHUB_TOKEN ||
    process.env.INPUT_GITHUB_TOKEN ||
    ''
  );
}

function readJson(name) {
  const raw = core.getInput(name);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (err) {
    core.warning(`Could not parse ${name} as JSON: ${err.message}`);
    return null;
  }
}

function loadConfig() {
  const owner = github.context && github.context.repo ? github.context.repo.owner : '';
  const cfg = {
    githubToken: readToken(),
    username: core.getInput('username') || owner,
    sections: readSections(),
    targetFile: core.getInput('target_file') || 'README.md',
    commitMessage: core.getInput('commit_message') || 'chore: update readme dashboard',
    commitName: core.getInput('commit_name') || 'github-actions[bot]',
    commitEmail:
      core.getInput('commit_email') ||
      '41898282+github-actions[bot]@users.noreply.github.com',
    commit: readBool('commit', true),
    configFile: core.getInput('config_file') || '.github/readme-dashboard.yml',

    inlineRender: {
      defaults: {
        date_format: core.getInput('date_format') || null,
        status_labels: readJson('status_labels'),
        viz_style: core.getInput('viz_style') || null,
        theme: core.getInput('theme') || null
      },
      sections: {}
    },

    shared: {
      maxRows: readInt('max_rows', 10),
      includeDrafts: readBool('include_drafts', false),
      repositories: readList('repositories'),
      excludeRepositories: readList('exclude_repositories')
    },

    sectionConfig: {
      recent_activity: {
        days: readInt('activity_days', 14)
      },
      activity_feed: {
        days: readInt('activity_feed_days', 0) || null,
        types: readList('activity_feed_types')
      },
      merged_prs: {
        windowDays: readInt('merged_window_days', 90)
      },
      stats: {
        periods: readList('stats_periods').length
          ? readList('stats_periods')
          : ['week', 'month', 'year']
      },
      pinned_prs: {
        state: core.getInput('pinned_prs_state') || 'all',
        startDate: core.getInput('pinned_prs_start_date') || null,
        endDate: core.getInput('pinned_prs_end_date') || null,
        blacklist: readList('pinned_prs_blacklist')
          .map((n) => parseInt(n, 10))
          .filter((n) => Number.isFinite(n)),
        sortBy: core.getInput('pinned_prs_sort_by') || 'updated'
      },
      stale_prs: {
        staleDays: readInt('stale_days', 14)
      },
      velocity_chart: {
        weeks: readInt('velocity_weeks', 12)
      },
      commit_heatmap: {
        months: readInt('heatmap_months', 12)
      },
      streak: {
        months: readInt('heatmap_months', 12)
      },
      command_center: {
        layout: readList('command_center_layout'),
        per_block_rows: readInt('command_center_rows', 5),
        orgs: readList('command_center_orgs'),
        disable_pat_warning: readBool('disable_pat_warning', false),
        stale_days: readInt('stale_days', 14)
      },
      open_prs: {
        show_ci: readBool('open_prs_show_ci', false)
      }
    }
  };

  return cfg;
}

function validate(cfg) {
  if (!cfg.githubToken) {
    throw new Error(
      'github_token is required. Provide a fine-grained PAT for cross-repo visibility — see docs/tokens.md.'
    );
  }
  if (!cfg.username) {
    throw new Error('username could not be inferred and was not provided.');
  }
  if (cfg.sections.length === 0) {
    throw new Error(
      `sections is empty or contained only unknown names. Known sections: ${KNOWN_SECTIONS.join(', ')}.`
    );
  }
}

module.exports = {
  KNOWN_SECTIONS,
  loadConfig,
  validate
};
