import { useEffect, useState } from "react";
import {
  getRepositoryCommits,
  getRepositoryIssues,
  getRepositoryPullRequests,
  type GitHubCommit,
  type GitHubIssue,
  type GitHubPullRequest,
} from "../services/githubApi";
import {
  analyzeRepositoryHealth,
  type RepositoryHealthSummary,
} from "../analytics/repositoryHealthAnalysis";

type RepositoryHealthIntelligenceProps = {
  owner: string;
  repository: string;
};

export default function RepositoryHealthIntelligence({
  owner,
  repository,
}: RepositoryHealthIntelligenceProps) {
  const [summary, setSummary] =
    useState<RepositoryHealthSummary | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadHealth() {
      try {
        setLoading(true);
        setError(null);

        const [
          commits,
          issues,
          pullRequests,
        ] = await Promise.all([
          getRepositoryCommits(
  owner,
  repository,
  new Date(
    Date.now() -
      30 * 24 * 60 * 60 * 1000
  ).toISOString()
),
          getRepositoryIssues(
            owner,
            repository
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
          analyzeRepositoryHealth(
            commits as GitHubCommit[],
            issues as GitHubIssue[],
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
            : "Unable to calculate repository health."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadHealth();

    return () => {
      cancelled = true;
    };
  }, [owner, repository]);

  if (loading) {
    return (
      <section className="repository-health-intelligence">
        <div className="repository-health-loading">
          Analyzing repository health...
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="repository-health-intelligence">
        <div className="repository-health-error">
          {error}
        </div>
      </section>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <section className="repository-health-intelligence">
      {/* ================================================= */}
      {/* HEADER                                            */}
      {/* ================================================= */}

      <div className="repository-health-header">
        <div>
          <span className="section-eyebrow">
            ENGINEERING INTELLIGENCE
          </span>

          <h2>Repository Health</h2>

          <p>
            An engineering health assessment based on
            repository activity, maintenance, collaboration,
            and stability signals.
          </p>
        </div>

        <div className="repository-health-score">
          <span>HEALTH SCORE</span>

          <strong>
            {summary.score}
            <small>/100</small>
          </strong>

          <em>{summary.level}</em>
        </div>
      </div>

      {/* ================================================= */}
      {/* SCORE BREAKDOWN                                   */}
      {/* ================================================= */}

      <div className="repository-health-metrics">
        <div className="repository-health-card">
          <span>ACTIVITY</span>
          <strong>
            {summary.activityScore}
          </strong>
        </div>

        <div className="repository-health-card">
          <span>MAINTENANCE</span>
          <strong>
            {summary.maintenanceScore}
          </strong>
        </div>

        <div className="repository-health-card">
          <span>COLLABORATION</span>
          <strong>
            {summary.collaborationScore}
          </strong>
        </div>

        <div className="repository-health-card">
          <span>STABILITY</span>
          <strong>
            {summary.stabilityScore}
          </strong>
        </div>
      </div>

      {/* ================================================= */}
      {/* SIGNALS                                           */}
      {/* ================================================= */}

      <div className="repository-health-signals">
        <div className="repository-health-panel">
          <div className="repository-health-panel-header">
            <h3>Activity Signals</h3>
          </div>

          <div className="repository-health-signal-list">
            <div>
              <span>Recent commits</span>
              <strong>
                {summary.recentCommits}
              </strong>
            </div>

            <div>
              <span>Commit activity</span>
              <strong>
                {summary.commitActivity}
              </strong>
            </div>
          </div>
        </div>

        <div className="repository-health-panel">
          <div className="repository-health-panel-header">
            <h3>Maintenance Signals</h3>
          </div>

          <div className="repository-health-signal-list">
            <div>
              <span>Open issues</span>
              <strong>
                {summary.openIssues}
              </strong>
            </div>

            <div>
              <span>Stale issues</span>
              <strong>
                {summary.staleIssues}
              </strong>
            </div>

            <div>
              <span>Issue backlog</span>
              <strong>
                {summary.issueBacklog}
              </strong>
            </div>
          </div>
        </div>

        <div className="repository-health-panel">
          <div className="repository-health-panel-header">
            <h3>Pull Request Signals</h3>
          </div>

          <div className="repository-health-signal-list">
            <div>
              <span>Open PRs</span>
              <strong>
                {summary.openPullRequests}
              </strong>
            </div>

            <div>
              <span>Stale PRs</span>
              <strong>
                {summary.stalePullRequests}
              </strong>
            </div>

            <div>
              <span>Merged PRs</span>
              <strong>
                {summary.mergedPullRequests}
              </strong>
            </div>

            <div>
              <span>PR backlog</span>
              <strong>
                {summary.pullRequestBacklog}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================= */}
      {/* RISKS + RECOMMENDATIONS                           */}
      {/* ================================================= */}

      <div className="repository-health-details">
        <div className="repository-health-panel">
          <div className="repository-health-panel-header">
            <h3>Risk Signals</h3>
          </div>

          <div className="repository-health-list">
            {summary.risks.map(
              (risk, index) => (
                <div
                  key={`${risk}-${index}`}
                  className="repository-health-list-item"
                >
                  <span>{index + 1}</span>
                  <p>{risk}</p>
                </div>
              )
            )}
          </div>
        </div>

        <div className="repository-health-panel">
          <div className="repository-health-panel-header">
            <h3>Recommendations</h3>
          </div>

          <div className="repository-health-list">
            {summary.recommendations.map(
              (
                recommendation,
                index
              ) => (
                <div
                  key={`${recommendation}-${index}`}
                  className="repository-health-list-item"
                >
                  <span>{index + 1}</span>
                  <p>
                    {recommendation}
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* ================================================= */}
      {/* INSIGHT                                           */}
      {/* ================================================= */}

      <div className="repository-health-insight">
        <div className="repository-health-insight-icon">
          AI
        </div>

        <div>
          <span>REPOLENS INSIGHT</span>
          <p>{summary.insight}</p>
        </div>
      </div>
    </section>
  );
}
