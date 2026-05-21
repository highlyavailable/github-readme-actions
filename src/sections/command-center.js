const openPrs = require('./open-prs');
const responseInbox = require('./response-inbox');
const reviewInbox = require('./review-inbox');
const stalePrs = require('./stale-prs');
const failingCi = require('./failing-ci');
const readyToMerge = require('./ready-to-merge');
const velocityChart = require('./velocity-chart');
const stats = require('./stats');
const DEFAULT_LAYOUT = ['kpis', 'velocity', 'open_prs', 'response_inbox', 'review_inbox'];

const KNOWN_BLOCKS = {
  kpis: 'KPI header',
  velocity: 'Velocity chart',
  open_prs: 'Top open PRs',
  stale_prs: 'Stale PRs',
  failing_ci: 'Failing CI',
  ready_to_merge: 'Ready to merge',
  response_inbox: 'Response inbox',
  review_inbox: 'Review inbox'
};

const SUB_RENDERERS = {
  open_prs: openPrs,
  stale_prs: stalePrs,
  failing_ci: failingCi,
  ready_to_merge: readyToMerge,
  response_inbox: responseInbox,
  review_inbox: reviewInbox,
  velocity_chart: velocityChart
};

function subCtx(ctx, maxRows) {
  return {
    ...ctx,
    shared: { ...ctx.shared, maxRows },
    config: ctx.config,
    render: ctx.render
  };
}

async function renderKpis(ctx) {
  // Get a single-period stats snapshot.
  const statsCtx = { ...ctx, config: { periods: ['week'] } };
  const statsResult = await stats.render(statsCtx);
  return statsResult.content;
}

async function renderHeader(ctx, kpis) {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
  return [`> **Command Center** — ${ctx.username} · _Updated ${now}_`, '', kpis].join('\n');
}

async function renderSubsection(name, ctx, perBlockRows) {
  const renderer = SUB_RENDERERS[name];
  if (!renderer) return null;
  try {
    const result = await renderer.render(subCtx(ctx, perBlockRows));
    return {
      title: renderer.title || KNOWN_BLOCKS[name] || name,
      content: result.content,
      metadata: result.metadata || {}
    };
  } catch (err) {
    return {
      title: KNOWN_BLOCKS[name] || name,
      content: `_Failed to render: ${err.message}_`,
      metadata: { error: err.message }
    };
  }
}

function renderFooter(metadata) {
  const parts = [];
  for (const [key, count] of Object.entries(metadata)) {
    if (typeof count === 'number') parts.push(`${key.replace(/_/g, ' ')}: ${count}`);
  }
  if (!parts.length) return '';
  return `\n---\n_${parts.join(' · ')}_`;
}

async function render(ctx) {
  const { config } = ctx;
  const layout = config?.layout && config.layout.length ? config.layout : DEFAULT_LAYOUT;
  const perBlockRows = config?.per_block_rows || 5;

  const blocks = [];
  const aggregateMeta = {};

  for (const block of layout) {
    if (block === 'kpis') {
      const kpis = await renderKpis(ctx);
      blocks.push(await renderHeader(ctx, kpis));
    } else if (block === 'velocity') {
      try {
        const v = await velocityChart.render(subCtx(ctx, perBlockRows));
        blocks.push(`#### Velocity\n\n${v.content}`);
      } catch (err) {
        blocks.push(`#### Velocity\n\n_Failed to render: ${err.message}_`);
      }
    } else if (SUB_RENDERERS[block]) {
      const sub = await renderSubsection(block, ctx, perBlockRows);
      if (sub) {
        blocks.push(`#### ${sub.title}\n\n${sub.content}`);
        if (sub.metadata?.count !== undefined) {
          aggregateMeta[`${block}_count`] = sub.metadata.count;
        }
      }
    }
  }

  blocks.push(renderFooter(aggregateMeta));

  return {
    content: blocks.filter(Boolean).join('\n\n'),
    metadata: aggregateMeta
  };
}

module.exports = {
  name: 'command_center',
  title: 'Command Center',
  defaultStyle: 'composite',
  defaultColumns: null,
  defaultEmptyState: 'No data available.',
  availableColumns: {},
  defaultLayout: DEFAULT_LAYOUT,
  knownBlocks: KNOWN_BLOCKS,
  render
};
