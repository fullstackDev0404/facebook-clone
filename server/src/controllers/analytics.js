const { getOverview } = require('./analytics/overview')
const { getActivityTimeline } = require('./analytics/activity')
const { getPostAnalytics } = require('./analytics/posts')
const { getEngagementAnalytics } = require('./analytics/engagement')

module.exports = {
    getOverview,
    getActivityTimeline,
    getPostAnalytics,
    getEngagementAnalytics,
}
