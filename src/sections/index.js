const openPrs = require('./open-prs');
const responseInbox = require('./response-inbox');
const reviewInbox = require('./review-inbox');
const recentActivity = require('./recent-activity');
const activityFeed = require('./activity-feed');
const mergedPrs = require('./merged-prs');
const stats = require('./stats');
const pinnedPrs = require('./pinned-prs');
const stalePrs = require('./stale-prs');
const failingCi = require('./failing-ci');
const readyToMerge = require('./ready-to-merge');
const velocityChart = require('./velocity-chart');
const commitHeatmap = require('./commit-heatmap');
const streak = require('./streak');
const commandCenter = require('./command-center');

const REGISTRY = {
  [openPrs.name]: openPrs,
  [responseInbox.name]: responseInbox,
  [reviewInbox.name]: reviewInbox,
  [recentActivity.name]: recentActivity,
  [activityFeed.name]: activityFeed,
  [mergedPrs.name]: mergedPrs,
  [stats.name]: stats,
  [pinnedPrs.name]: pinnedPrs,
  [stalePrs.name]: stalePrs,
  [failingCi.name]: failingCi,
  [readyToMerge.name]: readyToMerge,
  [velocityChart.name]: velocityChart,
  [commitHeatmap.name]: commitHeatmap,
  [streak.name]: streak,
  [commandCenter.name]: commandCenter,
  // `standup` is the current name for the composite dashboard; `command_center`
  // is kept as an alias so existing markers and workflows keep working.
  standup: commandCenter
};

function get(name) {
  return REGISTRY[name];
}

module.exports = { REGISTRY, get };
