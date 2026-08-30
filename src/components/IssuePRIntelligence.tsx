import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  GitPullRequest,
  MessageSquare,
  RefreshCw,
  ShieldAlert,
  CircleDot,
} from "lucide-react";

import {
  getRepositoryIssues,
  getRepositoryPullRequests,
  type GitHubIssue,
  type GitHubPullRequest,
} from "../services/githubApi";

import {
  analyzeIssuePR,
  type IssuePRSummary,
} from "../analytics/issuePRAnalysis";

/* ================================================= */
/* PROPS                                             */
/* ================================================= */

type IssuePRIntelligenceProps = {
  owner: string;
  repository: string;
};

/* ================================================= */
/* COMPONENT                                         */
/* ================================================= */

export default function IssuePRIntelligence({
  owner,
  repository,
}: IssuePRIntelligenceProps) {
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [pullRequests, setPullRequests] = useState<
    GitHubPullRequest[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  /* ================================================= */
  /* FETCH DATA                                        */
  /* ================================================= */

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const [
        issueData,
        pullRequestData,
      ] = await Promise.all([
        getRepositoryIssues(
          owner,
          repository
        ),
        getRepositoryPullRequests(
          owner,
          repository
        ),
      ]);

      setIssues(issueData);
      setPullRequests(
        pullRequestData
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load issue and pull request data."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [owner, repository]);

  /* ================================================= */
  /* ANALYSIS                                          */
  /* ================================================= */

  const summary: IssuePRSummary | null =
    useMemo(() => {
      if (
        issues.length === 0 &&
        pullRequests.length === 0
      ) {
        return null;
      }

      return analyzeIssuePR(
        issues,
        pullRequests
      );
    }, [issues, pullRequests]);

  /* ================================================= */
  /* LOADING                                           */
  /* ================================================= */

  if (loading) {
    return (
      <section className="issue-pr-section">
        <div className="analytics-heading">
          <div>
            <p className="preview-label">
              Issue & PR Intelligence
            </p>

            <h3>
              Analyzing repository workflow
            </h3>
          </div>

          <RefreshCw
            size={18}
            className="loading-icon"
          />
        </div>

        <div className="issue-pr-loading">
          Fetching issues and pull requests
          from GitHub...
        </div>
      </section>
    );
  }

  /* ================================================= */
  /* ERROR                                             */
  /* ================================================= */

  if (error) {
    return (
      <section className="issue-pr-section">
        <div className="analytics-heading">
          <div>
            <p className="preview-label">
              Issue & PR Intelligence
            </p>

            <h3>
              Unable to analyze workflow
            </h3>
          </div>

          <ShieldAlert size={18} />
        </div>

        <div className="issue-pr-error">
          <AlertTriangle size={18} />

          <span>{error}</span>
        </div>
      </section>
    );
  }

  /* ================================================= */
  /* EMPTY                                             */
  /* ================================================= */

  if (!summary) {
    return (
      <section className="issue-pr-section">
        <div className="analytics-heading">
          <div>
            <p className="preview-label">
              Issue & PR Intelligence
            </p>

            <h3>
              No issue or PR data
            </h3>
          </div>
        </div>

        <p className="issue-pr-empty">
          GitHub did not return issue or pull
          request activity for this repository.
        </p>
      </section>
    );
  }

  /* ================================================= */
  /* RENDER                                            */
  /* ================================================= */

  return (
    <section className="issue-pr-section">
      {/* HEADER */}

      <div className="analytics-heading">
        <div>
          <p className="preview-label">
            Issue & PR Intelligence
          </p>

          <h3>
            Repository workflow health
          </h3>
        </div>

        <div
          className={`issue-pr-risk ${summary.riskLevel.toLowerCase()}`}
        >
          {summary.riskLevel}

          <span>
            {summary.riskScore}/100
          </span>
        </div>
      </div>

      {/* OVERVIEW */}

      <div className="issue-pr-grid">
        <MetricCard
          icon={
            <CircleDot size={18} />
          }
          label="Open Issues"
          value={summary.openIssues}
          detail={`${summary.closedIssues} closed`}
        />

        <MetricCard
          icon={
            <CheckCircle2 size={18} />
          }
          label="Issue Resolution"
          value={`${summary.issueResolutionRate}%`}
          detail="Resolved issues"
        />

        <MetricCard
          icon={
            <GitPullRequest size={18} />
          }
          label="Open Pull Requests"
          value={
            summary.openPullRequests
          }
          detail={`${summary.mergedPullRequests} merged`}
        />

        <MetricCard
          icon={
            <CheckCircle2 size={18} />
          }
          label="PR Merge Rate"
          value={`${summary.pullRequestMergeRate}%`}
          detail="Merged pull requests"
        />
      </div>

      {/* BACKLOG */}

      <div className="issue-pr-details">
        <div className="issue-pr-detail-card">
          <div className="issue-pr-detail-header">
            <div>
              <p className="preview-label">
                Issue Backlog
              </p>

              <strong>
                {summary.openIssues} open
              </strong>
            </div>

            <CircleDot size={18} />
          </div>

          <div className="issue-pr-progress">
            <span
              style={{
                width: `${Math.min(
                  100,
                  summary.openIssues
                )}%`,
              }}
            />
          </div>

          <div className="issue-pr-detail-footer">
            <span>
              {summary.staleIssues} stale
            </span>

            <span>
              {summary.averageIssueComments} avg.
              comments
            </span>
          </div>
        </div>

        <div className="issue-pr-detail-card">
          <div className="issue-pr-detail-header">
            <div>
              <p className="preview-label">
                Pull Request Flow
              </p>

              <strong>
                {summary.openPullRequests} open
              </strong>
            </div>

            <GitPullRequest size={18} />
          </div>

          <div className="issue-pr-progress">
            <span
              style={{
                width: `${Math.min(
                  100,
                  summary.openPullRequests *
                    5
                )}%`,
              }}
            />
          </div>

          <div className="issue-pr-detail-footer">
            <span>
              {summary.stalePullRequests} stale
            </span>

            <span>
              {summary.averagePullRequestComments}{" "}
              avg. comments
            </span>
          </div>
        </div>
      </div>

      {/* RISK */}

      <div className="issue-pr-risk-panel">
        <div className="issue-pr-risk-icon">
          {summary.riskLevel ===
          "LOW" ? (
            <CheckCircle2 size={20} />
          ) : (
            <AlertTriangle size={20} />
          )}
        </div>

        <div>
          <p className="preview-label">
            Workflow Risk
          </p>

          <strong>
            {summary.riskLevel} risk
          </strong>

          <p>
            {summary.insight}
          </p>
        </div>
      </div>

      {/* STALE ITEMS */}

      {(summary.staleIssues > 0 ||
        summary.stalePullRequests > 0) && (
        <div className="issue-pr-stale">
          <div className="issue-pr-stale-heading">
            <AlertTriangle size={17} />

            <span>
              Stale activity detected
            </span>
          </div>

          <div className="issue-pr-stale-items">
            {summary.staleIssues > 0 && (
              <span>
                {summary.staleIssues} stale issues
              </span>
            )}

            {summary.stalePullRequests >
              0 && (
              <span>
                {
                  summary.stalePullRequests
                }{" "}
                stale pull requests
              </span>
            )}
          </div>
        </div>
      )}

      {/* COMMENTS */}

      <div className="issue-pr-comments">
        <MessageSquare size={17} />

        <span>
          Community discussion averages{" "}
          <strong>
            {summary.averageIssueComments}
          </strong>{" "}
          comments per issue and{" "}
          <strong>
            {
              summary.averagePullRequestComments
            }
          </strong>{" "}
          comments per pull request.
        </span>
      </div>
    </section>
  );
}

/* ================================================= */
/* METRIC CARD                                       */
/* ================================================= */

function MetricCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div className="issue-pr-metric">
      <div className="issue-pr-metric-icon">
        {icon}
      </div>

      <div>
        <p>{label}</p>

        <strong>{value}</strong>

        <span>{detail}</span>
      </div>
    </div>
  );
}