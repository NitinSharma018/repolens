import { useEffect, useState } from "react";
import {
  getRepositoryCommits,
  getRepositoryPullRequests,
  type GitHubCommit,
  type GitHubPullRequest,
} from "../services/githubApi";
import {
  analyzeDevelopmentTrend,
  type DevelopmentTrendSummary,
} from "../analytics/developmentTrendAnalysis";

type DevelopmentTrendIntelligenceProps = {
  owner: string;
  repository: string;
};

function getTrendClass(
  trend: DevelopmentTrendSummary["trend"]
) {
  if (trend === "IMPROVING") {
    return "trend-improving";
  }

  if (trend === "DECLINING") {
    return "trend-declining";
  }

  return "trend-stable";
}

function getActivityClass(
  level: DevelopmentTrendSummary["activityLevel"]
) {
  if (level === "HIGH") {
    return "activity-high";
  }

  if (level === "LOW") {
    return "activity-low";
  }

  return "activity-moderate";
}

export default function DevelopmentTrendIntelligence({
  owner,
  repository,
}: DevelopmentTrendIntelligenceProps) {
  const [summary, setSummary] =
    useState<DevelopmentTrendSummary | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const since = new Date(
          Date.now() -
            60 *
              24 *
              60 *
              60 *
              1000
        ).toISOString();

        const [
          commits,
          pullRequests,
        ] = await Promise.all([
          getRepositoryCommits(
            owner,
            repository,
            since
          ),
          getRepositoryPullRequests(
            owner,
            repository
          ),
        ]);

        if (cancelled) {
          return;
        }

        const result =
          analyzeDevelopmentTrend(
            commits as GitHubCommit[],
            pullRequests as GitHubPullRequest[]
          );

        setSummary(result);
      } catch (err) {
        if (cancelled) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load development trend data."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [owner, repository]);

  if (loading) {
    return (
      <section className="development-trend-intelligence">
        <div className="development-trend-loading">
          Analyzing development trends...
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="development-trend-intelligence">
        <div className="development-trend-error">
          {error}
        </div>
      </section>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <section className="development-trend-intelligence">
      <div className="development-trend-header">
        <div>
          <div className="section-eyebrow">
            DEVELOPMENT TREND
          </div>

          <h2>
            Development Trend Intelligence
          </h2>

          <p>
            Understand how repository
            development activity is changing
            over time.
          </p>
        </div>

        <div
          className={`development-trend-badge ${getTrendClass(
            summary.trend
          )}`}
        >
          {summary.trend}
        </div>
      </div>

      <div className="development-trend-overview">
        <div className="development-trend-score">
          <span className="development-trend-score-value">
            {summary.trendScore}
          </span>

          <span className="development-trend-score-label">
            Trend Score
          </span>
        </div>

        <div
          className={`development-trend-activity ${getActivityClass(
            summary.activityLevel
          )}`}
        >
          <span className="development-trend-activity-label">
            Activity Level
          </span>

          <strong>
            {summary.activityLevel}
          </strong>
        </div>
      </div>

      <div className="development-trend-metrics">
        <div className="development-trend-metric-card">
          <span>Recent Commits</span>

          <strong>
            {summary.recentCommits}
          </strong>

          <small>
            {summary.commitChange >= 0
              ? "+"
              : ""}
            {summary.commitChange}% vs previous
            period
          </small>
        </div>

        <div className="development-trend-metric-card">
          <span>Pull Requests</span>

          <strong>
            {summary.recentPullRequests}
          </strong>

          <small>
            {summary.pullRequestChange >= 0
              ? "+"
              : ""}
            {summary.pullRequestChange}% vs previous
            period
          </small>
        </div>

        <div className="development-trend-metric-card">
          <span>Merged PRs</span>

          <strong>
            {summary.recentMergedPullRequests}
          </strong>

          <small>
            {summary.mergeChange >= 0
              ? "+"
              : ""}
            {summary.mergeChange}% vs previous
            period
          </small>
        </div>

        <div className="development-trend-metric-card">
          <span>Active Days</span>

          <strong>
            {summary.activeDays}
          </strong>

          <small>
            in the last 30 days
          </small>
        </div>
      </div>

      <div className="development-trend-details">
        <div className="development-trend-panel">
          <div className="development-trend-panel-header">
            <h3>Development Signals</h3>
          </div>

          <div className="development-trend-signal-list">
            <div className="development-trend-signal">
              <span>Commit Frequency</span>

              <strong>
                {summary.recentCommitFrequency}
                /day
              </strong>
            </div>

            <div className="development-trend-signal">
              <span>Recent Commits</span>

              <strong>
                {summary.recentCommits}
              </strong>
            </div>

            <div className="development-trend-signal">
              <span>Previous Commits</span>

              <strong>
                {summary.previousCommits}
              </strong>
            </div>

            <div className="development-trend-signal">
              <span>Active Development Days</span>

              <strong>
                {summary.activeDays}/30
              </strong>
            </div>
          </div>
        </div>

        <div className="development-trend-panel">
          <div className="development-trend-panel-header">
            <h3>Change Analysis</h3>
          </div>

          <div className="development-trend-change-list">
            <div className="development-trend-change">
              <span>Commit Activity</span>

              <strong>
                {summary.commitChange >= 0
                  ? "+"
                  : ""}
                {summary.commitChange}%
              </strong>
            </div>

            <div className="development-trend-change">
              <span>PR Activity</span>

              <strong>
                {summary.pullRequestChange >=
                0
                  ? "+"
                  : ""}
                {summary.pullRequestChange}%
              </strong>
            </div>

            <div className="development-trend-change">
              <span>Merge Activity</span>

              <strong>
                {summary.mergeChange >= 0
                  ? "+"
                  : ""}
                {summary.mergeChange}%
              </strong>
            </div>
          </div>
        </div>
      </div>

      <div className="development-trend-insight">
        <div className="development-trend-insight-icon">
          💡
        </div>

        <div>
          <strong>RepoLens Insight</strong>

          <p>
            {summary.insight}
          </p>
        </div>
      </div>
    </section>
  );
}