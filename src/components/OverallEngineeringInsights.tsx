import { useEffect, useState } from "react";

import {
  getRepositoryCommits,
  getRepositoryContributors,
  getRepositoryIssues,
  getRepositoryPullRequests,
  getRepositoryTree,
  type GitHubCommit,
  type GitHubContributor,
  type GitHubIssue,
  type GitHubPullRequest,
  type GitHubContent,
} from "../services/githubApi";

import { analyzeContributors } from "../analytics/contributorAnalysis";
import { analyzeIssuePR } from "../analytics/issuePRAnalysis";
import { analyzeCodebase } from "../analytics/codebaseAnalysis";
import { analyzeRepositoryHealth } from "../analytics/repositoryHealthAnalysis";
import { analyzeDevelopmentTrend } from "../analytics/developmentTrendAnalysis";
import { analyzeReleaseVersion } from "../analytics/releaseVersionAnalysis";

import {
  analyzeOverallEngineering,
  type OverallEngineeringSummary,
} from "../analytics/overallEngineeringAnalysis";

type OverallEngineeringInsightsProps = {
  owner: string;
  repository: string;
};

function getVerdictClass(
  verdict: OverallEngineeringSummary["verdict"]
): string {
  switch (verdict) {
    case "EXCELLENT":
      return "overall-verdict excellent";

    case "HEALTHY":
      return "overall-verdict healthy";

    case "NEEDS ATTENTION":
      return "overall-verdict attention";

    case "AT RISK":
      return "overall-verdict risk";

    default:
      return "overall-verdict";
  }
}

function getScoreClass(score: number): string {
  if (score >= 80) {
    return "score-excellent";
  }

  if (score >= 65) {
    return "score-healthy";
  }

  if (score >= 45) {
    return "score-attention";
  }

  return "score-risk";
}

export default function OverallEngineeringInsights({
  owner,
  repository,
}: OverallEngineeringInsightsProps) {
  const [summary, setSummary] =
    useState<OverallEngineeringSummary | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadOverallEngineering() {
      try {
        setLoading(true);
        setError(null);
        setSummary(null);

        const thirtyDaysAgo = new Date(
          Date.now() -
            30 *
              24 *
              60 *
              60 *
              1000
        ).toISOString();

        const [
          contributors,
          issues,
          pullRequests,
          tree,
          recentCommits,
        ] = await Promise.all([
          getRepositoryContributors(
            owner,
            repository
          ),

          getRepositoryIssues(
            owner,
            repository
          ),

          getRepositoryPullRequests(
            owner,
            repository
          ),

          getRepositoryTree(
            owner,
            repository
          ),

          getRepositoryCommits(
            owner,
            repository,
            thirtyDaysAgo
          ),
        ]);

        if (cancelled) {
          return;
        }

        const contributorSummary =
          analyzeContributors(
            contributors as GitHubContributor[]
          );

        const issuePRSummary =
          analyzeIssuePR(
            issues as GitHubIssue[],
            pullRequests as GitHubPullRequest[]
          );

        const codebaseAnalysis =
          analyzeCodebase(
            tree as GitHubContent[]
          );

        const repositoryHealthSummary =
          analyzeRepositoryHealth(
            recentCommits as GitHubCommit[],
            issues as GitHubIssue[],
            pullRequests as GitHubPullRequest[]
          );

        const developmentTrendSummary =
          analyzeDevelopmentTrend(
            recentCommits as GitHubCommit[],
            pullRequests as GitHubPullRequest[]
          );

        const releasesResponse = await fetch(
          `/api/github?path=${encodeURIComponent(
            `/repos/${encodeURIComponent(
              owner
            )}/${encodeURIComponent(
              repository
            )}/releases?per_page=100`
          )}`
        );

        if (!releasesResponse.ok) {
          throw new Error(
            "Failed to load release data."
          );
        }

        const releases =
          await releasesResponse.json();

        if (cancelled) {
          return;
        }

        const releaseVersionSummary =
          analyzeReleaseVersion(releases);

        const overallSummary =
          analyzeOverallEngineering(
            contributorSummary,
            issuePRSummary,
            codebaseAnalysis,
            repositoryHealthSummary,
            developmentTrendSummary,
            releaseVersionSummary
          );

        if (
          !overallSummary ||
          typeof overallSummary.overallScore !==
            "number"
        ) {
          throw new Error(
            "Overall engineering analysis returned invalid data."
          );
        }

        if (cancelled) {
          return;
        }

        setSummary(overallSummary);
      } catch (err) {
        if (cancelled) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load overall engineering insights."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadOverallEngineering();

    return () => {
      cancelled = true;
    };
  }, [owner, repository]);

  if (loading) {
    return (
      <section className="overall-engineering-section">
        <div className="overall-engineering-loading">
          Analyzing overall engineering health...
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="overall-engineering-section">
        <div className="overall-engineering-error">
          {error}
        </div>
      </section>
    );
  }

  if (!summary) {
    return (
      <section className="overall-engineering-section">
        <div className="overall-engineering-error">
          Overall engineering insights are unavailable.
        </div>
      </section>
    );
  }

  return (
    <section className="overall-engineering-section">
      <div className="overall-engineering-header">
        <div>
          <p className="section-eyebrow">
            Engineering Intelligence
          </p>

          <h2>Overall Engineering Insights</h2>

          <p className="section-description">
            A combined assessment of repository health,
            code quality, collaboration, development activity,
            issue management, and release practices.
          </p>
        </div>

        <div className="overall-score-card">
          <div
            className={`overall-score ${getScoreClass(
              summary.overallScore
            )}`}
          >
            {summary.overallScore}
          </div>

          <div className="overall-score-label">
            Engineering Score
          </div>

          <div
            className={getVerdictClass(
              summary.verdict
            )}
          >
            {summary.verdict}
          </div>
        </div>
      </div>

      <div className="overall-engineering-grid">
        <div className="overall-insight-card strengths-card">
          <div className="overall-card-heading">
            <span className="overall-card-icon">
              ✓
            </span>

            <h3>Engineering Strengths</h3>
          </div>

          {summary.strengths.length > 0 ? (
            <ul className="overall-list">
              {summary.strengths.map(
                (strength) => (
                  <li key={strength}>
                    {strength}
                  </li>
                )
              )}
            </ul>
          ) : (
            <p className="overall-empty">
              No major strengths were detected.
            </p>
          )}
        </div>

        <div className="overall-insight-card risks-card">
          <div className="overall-card-heading">
            <span className="overall-card-icon">
              !
            </span>

            <h3>Engineering Risks</h3>
          </div>

          {summary.risks.length > 0 ? (
            <ul className="overall-list">
              {summary.risks.map(
                (risk) => (
                  <li key={risk}>
                    {risk}
                  </li>
                )
              )}
            </ul>
          ) : (
            <p className="overall-empty">
              No significant engineering risks detected.
            </p>
          )}
        </div>

        <div className="overall-insight-card improvement-card">
          <div className="overall-card-heading">
            <span className="overall-card-icon">
              ↗
            </span>

            <h3>Improvement Areas</h3>
          </div>

          {summary.improvementAreas.length > 0 ? (
            <ul className="overall-list">
              {summary.improvementAreas.map(
                (area) => (
                  <li key={area}>
                    {area}
                  </li>
                )
              )}
            </ul>
          ) : (
            <p className="overall-empty">
              No immediate improvement areas identified.
            </p>
          )}
        </div>

        <div className="overall-insight-card recommendations-card">
          <div className="overall-card-heading">
            <span className="overall-card-icon">
              →
            </span>

            <h3>Actionable Recommendations</h3>
          </div>

          {summary.recommendations.length > 0 ? (
            <ul className="overall-list">
              {summary.recommendations.map(
                (recommendation) => (
                  <li key={recommendation}>
                    {recommendation}
                  </li>
                )
              )}
            </ul>
          ) : (
            <p className="overall-empty">
              Continue monitoring current engineering practices.
            </p>
          )}
        </div>
      </div>

      <div className="overall-final-insight">
        <div className="overall-final-heading">
          <span>◆</span>

          <h3>Engineering Verdict</h3>
        </div>

        <p>{summary.insight}</p>
      </div>
    </section>
  );
}