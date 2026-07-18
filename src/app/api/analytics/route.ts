import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";

// GET /api/analytics
// Returns real aggregate stats for the AnalyticsPanel + StoragePanel:
//   • totalPageviews + last 30 days series
//   • uniqueVisitors (distinct IPs) + 30d series
//   • submissionCreateCount (30d)
//   • feedbackSubmitCount (30d)
//   • showcaseClickCount (30d)
//   • storage breakdown: submissions, feedback, showcase, team, sessions,
//     activityLog, analyticsEvents counts
//   • engagement: avg rating of approved feedback, % completion of submissions
//
// Auth: requires admin (any role).
export async function GET(req: Request) {
  const actor = await requireAdmin(req);
  if (!actor.ok) return actor.response;

  const now = Date.now();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Run independent queries in parallel
  const [
    pageviewsAll,
    pageviews30d,
    submissions30d,
    feedback30d,
    showcaseClicks30d,
    totalSubmissions,
    totalFeedback,
    totalShowcase,
    totalTeam,
    totalSessions,
    totalActivity,
    totalAnalytics,
    approvedFeedback,
    submissionsByStatus,
    submissions7dSeries,
    pageviews7dSeries,
  ] = await Promise.all([
    db.analyticsEvent.count({ where: { kind: "pageview" } }),
    db.analyticsEvent.findMany({
      where: { kind: "pageview", createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true, ip: true },
    }),
    db.analyticsEvent.count({
      where: { kind: "submission_create", createdAt: { gte: thirtyDaysAgo } },
    }),
    db.analyticsEvent.count({
      where: { kind: "feedback_submit", createdAt: { gte: thirtyDaysAgo } },
    }),
    db.analyticsEvent.count({
      where: { kind: "showcase_click", createdAt: { gte: thirtyDaysAgo } },
    }),
    db.submission.count(),
    db.feedback.count(),
    db.showcase.count(),
    db.teamMember.count(),
    db.session.count(),
    db.activityLog.count(),
    db.analyticsEvent.count(),
    db.feedback.findMany({
      where: { status: "approved" },
      select: { rating: true },
    }),
    db.submission.findMany({ select: { status: true, createdAt: true } }),
    db.submission.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    }),
    db.analyticsEvent.findMany({
      where: { kind: "pageview", createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true, ip: true },
    }),
  ]);

  // Build 7-day series for pageviews + submissions
  const days7: { date: Date; label: string; pageviews: number; uniqueVisitors: Set<string>; submissions: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days7.push({
      date: d,
      label: d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2),
      pageviews: 0,
      uniqueVisitors: new Set<string>(),
      submissions: 0,
    });
  }
  for (const p of pageviews7dSeries) {
    const d = new Date(p.createdAt);
    for (const day of days7) {
      const next = new Date(day.date);
      next.setDate(day.date.getDate() + 1);
      if (d >= day.date && d < next) {
        day.pageviews++;
        if (p.ip) day.uniqueVisitors.add(p.ip);
        break;
      }
    }
  }
  for (const s of submissions7dSeries) {
    const d = new Date(s.createdAt);
    for (const day of days7) {
      const next = new Date(day.date);
      next.setDate(day.date.getDate() + 1);
      if (d >= day.date && d < next) {
        day.submissions++;
        break;
      }
    }
  }

  // 30-day unique visitors
  const uniqueVisitorSet = new Set<string>();
  for (const p of pageviews30d) {
    if (p.ip) uniqueVisitorSet.add(p.ip);
  }

  // Engagement: avg rating of approved feedback (0-5 → 0-100%)
  const avgRating =
    approvedFeedback.length === 0
      ? 0
      : approvedFeedback.reduce((sum, f) => sum + f.rating, 0) / approvedFeedback.length;
  const satisfactionPct = Math.round((avgRating / 5) * 100);

  // Engagement: completion rate of submissions
  const completedCount = submissionsByStatus.filter((s) => s.status === "Completed").length;
  const completionPct =
    submissionsByStatus.length === 0
      ? 0
      : Math.round((completedCount / submissionsByStatus.length) * 100);

  // 30-day traffic series (pageviews per day)
  const trafficSeries: number[] = new Array(30).fill(0);
  for (const p of pageviews30d) {
    const d = new Date(p.createdAt);
    const daysAgo = Math.floor((now - d.getTime()) / (24 * 60 * 60 * 1000));
    const idx = 29 - daysAgo;
    if (idx >= 0 && idx < 30) trafficSeries[idx]++;
  }
  // Growth % = (last 7 days vs previous 7 days)
  const last7 = trafficSeries.slice(23).reduce((a, b) => a + b, 0);
  const prev7 = trafficSeries.slice(16, 23).reduce((a, b) => a + b, 0);
  const trafficGrowthPct =
    prev7 === 0 ? 100 : Math.round(((last7 - prev7) / prev7) * 1000) / 10;

  return NextResponse.json({
    pageviews: {
      total: pageviewsAll,
      last30d: pageviews30d.length,
      uniqueVisitors30d: uniqueVisitorSet.size,
      series30d: trafficSeries,
      growthPct: trafficGrowthPct,
    },
    submissions: {
      total: totalSubmissions,
      last30d: submissions30d,
    },
    feedback: {
      total: totalFeedback,
      last30d: feedback30d,
    },
    showcase: {
      total: totalShowcase,
      clicks30d: showcaseClicks30d,
    },
    engagement: {
      satisfactionPct,
      completionPct,
      avgRating: Math.round(avgRating * 10) / 10,
      referralPct: Math.round((completionPct + satisfactionPct) / 2),
    },
    storage: {
      submissions: totalSubmissions,
      feedback: totalFeedback,
      showcase: totalShowcase,
      team: totalTeam,
      sessions: totalSessions,
      activityLog: totalActivity,
      analyticsEvents: totalAnalytics,
      totalDocuments:
        totalSubmissions +
        totalFeedback +
        totalShowcase +
        totalTeam +
        totalSessions +
        totalActivity +
        totalAnalytics,
    },
    series7d: days7.map((d) => ({
      label: d.label,
      pageviews: d.pageviews,
      uniqueVisitors: d.uniqueVisitors.size,
      submissions: d.submissions,
    })),
  });
}
