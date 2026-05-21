const openPrs = require('./open-prs');
const responseInbox = require('./response-inbox');
const reviewInbox = require('./review-inbox');
const recentActivity = require('./recent-activity');
const mergedPrs = require('./merged-prs');
const stats = require('./stats');
const pinnedPrs = require('./pinned-prs');

const REGISTRY = {
  [openPrs.name]: openPrs,
  [responseInbox.name]: responseInbox,
  [reviewInbox.name]: reviewInbox,
  [recentActivity.name]: recentActivity,
  [mergedPrs.name]: mergedPrs,
  [stats.name]: stats,
  [pinnedPrs.name]: pinnedPrs
};

function get(name) {
  return REGISTRY[name];
}

module.exports = { REGISTRY, get };
