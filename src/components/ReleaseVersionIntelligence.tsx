import { useEffect, useState } from "react";
import {
  analyzeReleaseVersion,
  type ReleaseVersionSummary,
} from "../analytics/releaseVersionAnalysis";

type ReleaseVersionIntelligenceProps = {
  owner: string;
  repository: string;
};

type GitHubRelease = {
  name?: string | null;
  tag_name: string;
  published_at?: string | null;
  created_at: string;
  draft: boolean;
  prerelease: boolean;
};

function getMaturityClass(
  maturity: ReleaseVersionSummary["maturity"]
) {
  if (maturity === "MATURE") {
    return "release-maturity-mature";
  }

  if (maturity === "ACTIVE") {
    return "release-maturity-active";
  }

  if (maturity === "LIMITED") {
    return "release-maturity-limited";
  }

  return "release-maturity-none";
}

function getTrendClass(
  trend: ReleaseVersionSummary["trend"]
) {
  if (trend === "ACTIVE") {
    return "release-trend-active";
  }

  if (trend === "STABLE") {
    return "release-trend-stable";
  }

  return "release-trend-inactive";
}

function formatReleaseDate(
  date: string | null
) {
  if (!date) {
    return "No release";
  }

  return new Date(date).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );
}

export default function ReleaseVersionIntelligence({
  owner,
  repository,
}: ReleaseVersionIntelligenceProps) {
  const [summary, setSummary] =
    useState<ReleaseVersionSummary | null>(
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


        const response =
          await fetch(
            `https://api.github.com/repos/${encodeURIComponent(
              owner
            )}/${encodeURIComponent(
              repository
            )}/releases?per_page=100`,
            {
              headers: {
                Accept:
                  "application/vnd.github+json",
                "X-GitHub-Api-Version":
                  "2026-03-10",
              },
            }
          );

        if (!response.ok) {
          throw new Error(
            "Unable to load repository releases."
          );
        }

        const releases =
          (await response.json()) as GitHubRelease[];

        if (cancelled) {
          return;
        }

        const result =
  analyzeReleaseVersion(releases);

        setSummary(result);
      } catch (err) {
        if (cancelled) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load release information."
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
      <section className="release-version-intelligence">
        <div className="release-version-loading">
          Analyzing release history...
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="release-version-intelligence">
        <div className="release-version-error">
          {error}
        </div>
      </section>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <section className="release-version-intelligence">
      <div className="release-version-header">
        <div>
          <div className="section-eyebrow">
            RELEASE & VERSION
          </div>

          <h2>
            Release & Version Intelligence
          </h2>

          <p>
            Evaluate release activity and
            versioning maturity across the
            repository.
          </p>
        </div>

        <div
          className={`release-version-badge ${getMaturityClass(
            summary.maturity
          )}`}
        >
          {summary.maturity}
        </div>
      </div>

      <div className="release-version-overview">
        <div className="release-version-score">
          <span className="release-version-score-value">
            {summary.versioningScore}
          </span>

          <span className="release-version-score-label">
            Versioning Score
          </span>
        </div>

        <div
          className={`release-version-trend ${getTrendClass(
            summary.trend
          )}`}
        >
          <span className="release-version-trend-label">
            Release Trend
          </span>

          <strong>
            {summary.trend}
          </strong>
        </div>
      </div>

      <div className="release-version-metrics">
        <div className="release-version-metric-card">
          <span>Total Releases</span>

          <strong>
            {summary.releaseCount}
          </strong>

          <small>
            published releases
          </small>
        </div>

        <div className="release-version-metric-card">
          <span>Recent Releases</span>

          <strong>
            {summary.recentReleaseCount}
          </strong>

          <small>
            within the last 180 days
          </small>
        </div>

        <div className="release-version-metric-card">
          <span>Latest Release</span>

          <strong className="release-version-release-name">
            {summary.latestReleaseName ??
              "None"}
          </strong>

          <small>
            {formatReleaseDate(
              summary.latestReleaseDate
            )}
          </small>
        </div>

        <div className="release-version-metric-card">
          <span>Release Recency</span>

          <strong>
            {summary.daysSinceLatestRelease ??
              "—"}
          </strong>

          <small>
            {summary.daysSinceLatestRelease !==
            null
              ? "days since latest release"
              : "no release history"}
          </small>
        </div>
      </div>

      <div className="release-version-details">
        <div className="release-version-panel">
          <div className="release-version-panel-header">
            <h3>Versioning Signals</h3>
          </div>

          <div className="release-version-signal-list">
            <div className="release-version-signal">
              <span>Release History</span>

              <strong>
                {summary.releaseCount > 0
                  ? "Available"
                  : "Limited"}
              </strong>
            </div>

            <div className="release-version-signal">
              <span>Version Tags</span>

              <strong>
                {summary.hasTags
                  ? "Detected"
                  : "Not detected"}
              </strong>
            </div>

            <div className="release-version-signal">
              <span>Recent Shipping</span>

              <strong>
                {summary.recentReleaseCount >
                0
                  ? "Active"
                  : "Limited"}
              </strong>
            </div>

            <div className="release-version-signal">
              <span>Release Maturity</span>

              <strong>
                {summary.maturity}
              </strong>
            </div>
          </div>
        </div>

        <div className="release-version-panel">
          <div className="release-version-panel-header">
            <h3>Latest Release</h3>
          </div>

          <div className="release-version-latest">
            <div className="release-version-latest-tag">
              {summary.latestReleaseName ??
                "No releases"}
            </div>

            <div className="release-version-latest-date">
              {formatReleaseDate(
                summary.latestReleaseDate
              )}
            </div>

            <div className="release-version-latest-status">
              {summary.daysSinceLatestRelease !==
              null
                ? summary.daysSinceLatestRelease <=
                  30
                  ? "Recently shipped"
                  : summary.daysSinceLatestRelease <=
                    180
                  ? "Recently maintained"
                  : "Release activity is aging"
                : "No published release history"}
            </div>
          </div>
        </div>
      </div>

      <div className="release-version-insight">
        <div className="release-version-insight-icon">
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