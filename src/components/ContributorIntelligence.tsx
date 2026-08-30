import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  GitCommit,
  Loader2,
  TrendingUp,
  Users,
} from "lucide-react";

import {
  getRepositoryContributors,
  type GitHubContributor,
} from "../services/githubApi";

import {
  analyzeContributors,
  type ContributorSummary,
} from "../analytics/contributorAnalysis";

type ContributorIntelligenceProps = {
  owner: string;
  repository: string;
};

function getRiskIcon(
  riskLevel: ContributorSummary["riskLevel"]
) {
  if (riskLevel === "LOW") {
    return <CheckCircle2 size={20} />;
  }

  return <AlertTriangle size={20} />;
}

function getRiskDescription(
  riskLevel: ContributorSummary["riskLevel"]
) {
  if (riskLevel === "LOW") {
    return "Recent development activity is distributed across multiple contributors.";
  }

  if (riskLevel === "MODERATE") {
    return "A noticeable portion of recent development activity is concentrated among fewer contributors.";
  }

  return "A significant portion of recent development activity is concentrated among a small number of contributors.";
}

export default function ContributorIntelligence({
  owner,
  repository,
}: ContributorIntelligenceProps) {
  const [analysis, setAnalysis] =
    useState<ContributorSummary | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadContributors() {
      try {
        setLoading(true);
        setError(null);

        const contributors: GitHubContributor[] =
          await getRepositoryContributors(
            owner,
            repository
          );

        if (cancelled) {
          return;
        }

        const result =
          analyzeContributors(
            contributors
          );

        setAnalysis(result);
      } catch (err) {
        if (cancelled) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Unable to analyze contributors."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadContributors();

    return () => {
      cancelled = true;
    };
  }, [owner, repository]);

  /* LOADING */

  if (loading) {
    return (
      <section
        className="contributor-intelligence"
        aria-label="Contributor Intelligence"
      >
        <div className="contributor-section-header">
          <div>
            <span className="section-eyebrow">
              CONTRIBUTOR INTELLIGENCE
            </span>

            <h2>
              Analyzing project contributors...
            </h2>

            <p>
              RepoLens is analyzing recent contributor
              activity for this repository.
            </p>
          </div>

          <div className="contributor-loading-status">
            <Loader2
              size={18}
              className="contributor-spinner"
            />

            <span>
              Analyzing
            </span>
          </div>
        </div>

        <div className="contributor-loading-grid">
          <div className="contributor-skeleton" />
          <div className="contributor-skeleton" />
          <div className="contributor-skeleton" />
        </div>
      </section>
    );
  }

  /* ERROR */

  if (error) {
    return (
      <section
        className="contributor-intelligence"
        aria-label="Contributor Intelligence"
      >
        <div className="contributor-section-header">
          <div>
            <span className="section-eyebrow">
              CONTRIBUTOR INTELLIGENCE
            </span>

            <h2>
              Contributor analysis unavailable.
            </h2>

            <p>
              RepoLens could not retrieve contributor
              activity for this repository.
            </p>
          </div>

          <div className="contributor-error-status">
            <AlertTriangle size={18} />

            <span>
              Unavailable
            </span>
          </div>
        </div>

        <div className="contributor-error-card">
          <AlertTriangle size={20} />

          <div>
            <strong>
              Unable to load contributor data
            </strong>

            <p>
              {error}
            </p>
          </div>
        </div>
      </section>
    );
  }

  /* EMPTY */

  if (!analysis) {
    return (
      <section
        className="contributor-intelligence"
        aria-label="Contributor Intelligence"
      >
        <div className="contributor-section-header">
          <div>
            <span className="section-eyebrow">
              CONTRIBUTOR INTELLIGENCE
            </span>

            <h2>
              No contributor data available.
            </h2>

            <p>
              There is not enough contributor activity
              to generate an analysis.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const riskClass =
    analysis.riskLevel.toLowerCase();

  return (
    <section
      className="contributor-intelligence"
      aria-label="Contributor Intelligence"
    >
      {/* HEADER */}

      <div className="contributor-section-header">
        <div>
          <span className="section-eyebrow">
            CONTRIBUTOR INTELLIGENCE
          </span>

          <h2>
            Understand who is driving the project.
          </h2>

          <p>
            RepoLens analyzes recent contributor activity
            to identify collaboration patterns and
            contributor concentration.
          </p>
        </div>

        <div
          className={`contributor-risk-badge ${riskClass}`}
        >
          {getRiskIcon(
            analysis.riskLevel
          )}

          <div>
            <span>
              Contributor Risk
            </span>

            <strong>
              {analysis.riskLevel}
            </strong>
          </div>
        </div>
      </div>

      {/* SUMMARY STATS */}

      <div className="contributor-stats-grid">
        <div className="contributor-stat-card">
          <div className="contributor-stat-icon">
            <Users size={19} />
          </div>

          <div>
            <span>
              Total Contributors
            </span>

            <strong>
              {analysis.totalContributors.toLocaleString()}
            </strong>
          </div>
        </div>

        <div className="contributor-stat-card">
          <div className="contributor-stat-icon">
            <TrendingUp size={19} />
          </div>

          <div>
            <span>
              Active Contributors
            </span>

            <strong>
              {analysis.activeContributors.toLocaleString()}
            </strong>

            <small>
              Last 12 weeks
            </small>
          </div>
        </div>

        <div className="contributor-stat-card">
          <div className="contributor-stat-icon">
            <GitCommit size={19} />
          </div>

          <div>
            <span>
              Recent Commits
            </span>

            <strong>
              {analysis.totalRecentCommits.toLocaleString()}
            </strong>

            <small>
              Last 12 weeks
            </small>
          </div>
        </div>
      </div>

      {/* TOP CONTRIBUTORS */}

      <div className="top-contributors-card">
        <div className="card-heading">
          <div>
            <span>
              TOP CONTRIBUTORS
            </span>

            <h3>
              Recent contribution breakdown
            </h3>
          </div>

          <span className="top-contributors-period">
            Last 12 weeks
          </span>
        </div>

        <div className="top-contributors-list">
          {analysis.topContributors.map(
            (contributor, index) => (
              <div
                className="top-contributor-row"
                key={contributor.login}
              >
                <div className="contributor-rank">
                  #{index + 1}
                </div>

                <img
                  src={contributor.avatarUrl}
                  alt={`${contributor.login} avatar`}
                  className="contributor-list-avatar"
                />

                <div className="top-contributor-row-info">
                  <strong>
                    {contributor.login}
                  </strong>

                  <span>
                    {contributor.commits}{" "}
                    {contributor.commits === 1
                      ? "commit"
                      : "commits"}
                  </span>
                </div>

                <div className="top-contributor-row-share">
                  <strong>
                    {contributor.percentage}%
                  </strong>

                  <div className="mini-contribution-bar">
                    <div
                      style={{
                        width: `${Math.min(
                          contributor.percentage,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* ANALYSIS CARDS */}

      <div className="contributor-analysis-grid">

        {/* TOP CONTRIBUTOR */}

        <div className="top-contributor-card">
          <div className="card-heading">
            <div>
              <span>
                TOP CONTRIBUTOR
              </span>

              <h3>
                Most active contributor
              </h3>
            </div>
          </div>

          {analysis.topContributor ? (
            <div className="top-contributor-content">
              <img
                src={
                  analysis.topContributor.avatarUrl
                }
                alt={`${analysis.topContributor.login} avatar`}
                className="contributor-avatar"
              />

              <div className="top-contributor-info">
                <strong>
                  {analysis.topContributor.login}
                </strong>

                <span>
                  {
                    analysis.topContributor.commits
                  }{" "}
                  recent commits
                </span>
              </div>

              <div className="contributor-share">
                <strong>
                  {
                    analysis.topContributor
                      .percentage
                  }%
                </strong>

                <span>
                  of recent commits
                </span>
              </div>
            </div>
          ) : (
            <div className="contributor-empty">
              No recent contributor activity was detected.
            </div>
          )}
        </div>

        {/* CONTRIBUTOR CONCENTRATION */}

        <div className="concentration-card">
          <div className="card-heading">
            <div>
              <span>
                CONTRIBUTOR CONCENTRATION
              </span>

              <h3>
                Recent activity distribution
              </h3>
            </div>

            <strong className="concentration-score">
              {
                analysis.concentrationPercentage
              }%
            </strong>
          </div>

          <div className="concentration-bar">
            <div
              className={`concentration-fill ${riskClass}`}
              style={{
                width: `${Math.min(
                  analysis.concentrationPercentage,
                  100
                )}%`,
              }}
            />
          </div>

          <div className="concentration-labels">
            <span>
              Distributed
            </span>

            <span>
              Concentrated
            </span>
          </div>

          <p className="risk-description">
            {getRiskDescription(
              analysis.riskLevel
            )}
          </p>
        </div>
      </div>

      {/* INSIGHT */}

      <div
        className={`contributor-insight ${riskClass}`}
      >
        <div className="contributor-insight-icon">
          {getRiskIcon(
            analysis.riskLevel
          )}
        </div>

        <div>
          <span>
            REPO LENS INSIGHT
          </span>

          <p>
            {analysis.riskLevel === "LOW" &&
              `Development activity appears well distributed. ${analysis.activeContributors} active contributors generated ${analysis.totalRecentCommits} recent commits.`}

            {analysis.riskLevel === "MODERATE" &&
              `${analysis.concentrationPercentage}% of recent commits came from the top contributor. The project has multiple active contributors, but some development activity is concentrated.`}

            {analysis.riskLevel === "HIGH" &&
              `${analysis.concentrationPercentage}% of recent commits came from the top contributor. This indicates a strong dependency on a small portion of the contributor base.`}
          </p>
        </div>
      </div>

      {/* NOTE */}

      <div className="contributor-note">
        <span>
          ANALYSIS NOTE
        </span>

        <p>
          Contributor concentration is a RepoLens
          analytical indicator based on recent commit
          activity. It is not an official GitHub metric
          and should not be interpreted as a definitive
          measure of project risk.
        </p>
      </div>
    </section>
  );
}