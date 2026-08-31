import { useEffect, useState } from "react";

import {
  getRepositoryTree,
  type GitHubContent,
} from "../services/githubApi";

import {
  analyzeCodebase,
  type CodebaseAnalysis,
} from "../analytics/codebaseAnalysis";

/* ================================================= */
/* TYPES                                             */
/* ================================================= */

type CodebaseIntelligenceProps = {
  owner: string;
  repository: string;
};

/* ================================================= */
/* COMPONENT                                         */
/* ================================================= */

export default function CodebaseIntelligence({
  owner,
  repository,
}: CodebaseIntelligenceProps) {
  const [analysis, setAnalysis] =
    useState<CodebaseAnalysis | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  /* ================================================= */
  /* LOAD DATA                                         */
  /* ================================================= */

  useEffect(() => {
    let cancelled = false;

    async function loadCodebase() {
      try {
        setLoading(true);
        setError(null);

        const contents =
          await getRepositoryTree(
            owner,
            repository
          );

        if (cancelled) {
          return;
        }

        const result =
          analyzeCodebase(
            contents as GitHubContent[]
          );

        setAnalysis(result);
      } catch (err) {
        if (cancelled) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Unable to analyze repository codebase."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCodebase();

    return () => {
      cancelled = true;
    };
  }, [owner, repository]);

  /* ================================================= */
  /* LOADING                                           */
  /* ================================================= */

  if (loading) {
    return (
      <section className="codebase-intelligence">
        <div className="codebase-intelligence-header">
          <div>
            <span className="section-eyebrow">
              CODEBASE ANALYSIS
            </span>

            <h2>
              Codebase Intelligence
            </h2>

            <p>
              Analyzing repository
              structure and
              maintainability signals...
            </p>
          </div>
        </div>

        <div className="codebase-loading">
          Analyzing codebase...
        </div>
      </section>
    );
  }

  /* ================================================= */
  /* ERROR                                             */
  /* ================================================= */

  if (error) {
    return (
      <section className="codebase-intelligence">
        <div className="codebase-intelligence-header">
          <div>
            <span className="section-eyebrow">
              CODEBASE ANALYSIS
            </span>

            <h2>
              Codebase Intelligence
            </h2>

            <p>
              Repository structure
              analysis
            </p>
          </div>
        </div>

        <div className="codebase-error">
          {error}
        </div>
      </section>
    );
  }

  /* ================================================= */
  /* EMPTY STATE                                       */
  /* ================================================= */

  if (!analysis) {
    return null;
  }

  /* ================================================= */
  /* FORMAT HELPERS                                    */
  /* ================================================= */

  const formatBytes = (
    bytes: number
  ): string => {
    if (bytes === 0) {
      return "0 B";
    }

    const units = [
      "B",
      "KB",
      "MB",
      "GB",
    ];

    const index = Math.floor(
      Math.log(bytes) /
        Math.log(1024)
    );

    const safeIndex =
      Math.min(
        index,
        units.length - 1
      );

    return `${(
      bytes /
      Math.pow(
        1024,
        safeIndex
      )
    ).toFixed(
      safeIndex === 0 ? 0 : 1
    )} ${units[safeIndex]}`;
  };

  /* ================================================= */
  /* RENDER                                            */
  /* ================================================= */

  return (
    <section className="codebase-intelligence">
      {/* HEADER */}

      <div className="codebase-intelligence-header">
        <div>
          <span className="section-eyebrow">
            CODEBASE ANALYSIS
          </span>

          <h2>
            Codebase Intelligence
          </h2>

          <p>
            Structural analysis of the
            repository codebase and
            maintainability signals.
          </p>
        </div>

        <div className="codebase-health">
          <span>
            CODEBASE HEALTH
          </span>

          <strong>
            {analysis.healthScore}
            <small>/100</small>
          </strong>

          <em>
            {analysis.healthLevel}
          </em>
        </div>
      </div>

      {/* METRICS */}

      <div className="codebase-metrics">
        <div className="codebase-metric-card">
          <span>
            TOTAL FILES
          </span>

          <strong>
            {analysis.totalFiles}
          </strong>
        </div>

        <div className="codebase-metric-card">
          <span>
            DIRECTORIES
          </span>

          <strong>
            {analysis.totalDirectories}
          </strong>
        </div>

        <div className="codebase-metric-card">
          <span>
            SOURCE FILES
          </span>

          <strong>
            {analysis.sourceFiles}
          </strong>
        </div>

        <div className="codebase-metric-card">
          <span>
            TEST FILES
          </span>

          <strong>
            {analysis.testFiles}
          </strong>
        </div>

        <div className="codebase-metric-card">
          <span>
            DOCUMENTATION
          </span>

          <strong>
            {analysis.documentationFiles}
          </strong>
        </div>

        <div className="codebase-metric-card">
          <span>
            CODE SIZE
          </span>

          <strong>
            {formatBytes(
              analysis.totalCodeSize
            )}
          </strong>
        </div>
      </div>

      {/* DETAILS */}

      <div className="codebase-details">
        {/* LANGUAGES */}

        <div className="codebase-panel">
          <div className="codebase-panel-header">
            <h3>
              Language Distribution
            </h3>

            <span>
              {analysis.languages.length} detected
            </span>
          </div>

          {analysis.languages.length ===
          0 ? (
            <div className="codebase-empty">
              No source languages
              detected.
            </div>
          ) : (
            <div className="codebase-language-list">
              {analysis.languages.map(
                (language) => (
                  <div
                    className="codebase-language"
                    key={
                      language.language
                    }
                  >
                    <div className="codebase-language-info">
                      <span>
                        {
                          language.language
                        }
                      </span>

                      <strong>
                        {
                          language.percentage
                        }
                        %
                      </strong>
                    </div>

                    <div className="codebase-progress">
                      <div
                        className="codebase-progress-fill"
                        style={{
                          width: `${language.percentage}%`,
                        }}
                      />
                    </div>

                    <small>
                      {language.files}{" "}
                      {language.files ===
                      1
                        ? "file"
                        : "files"}
                    </small>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* TESTING */}

        <div className="codebase-panel">
          <div className="codebase-panel-header">
            <h3>
              Testing Signals
            </h3>

            <span>
              {analysis.testRatio}%
            </span>
          </div>

          <div className="codebase-test-summary">
            <div>
              <strong>
                {analysis.testFiles}
              </strong>

              <span>
                Test files
              </span>
            </div>

            <div>
              <strong>
                {analysis.sourceFiles}
              </strong>

              <span>
                Source files
              </span>
            </div>
          </div>

          <div className="codebase-progress">
            <div
              className="codebase-progress-fill"
              style={{
                width: `${Math.min(
                  analysis.testRatio,
                  100
                )}%`,
              }}
            />
          </div>

          <p className="codebase-panel-note">
            Test-to-source file ratio
            detected from repository
            structure.
          </p>
        </div>

        {/* DIRECTORIES */}

        <div className="codebase-panel">
          <div className="codebase-panel-header">
            <h3>
              Top Directories
            </h3>
          </div>

          {analysis.topDirectories
            .length === 0 ? (
            <div className="codebase-empty">
              No directory structure
              detected.
            </div>
          ) : (
            <div className="codebase-directory-list">
              {analysis.topDirectories.map(
                (directory) => (
                  <div
                    className="codebase-directory"
                    key={
                      directory.name
                    }
                  >
                    <span>
                      {directory.name}
                    </span>

                    <strong>
                      {directory.files}
                    </strong>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* LARGEST FILES */}

        <div className="codebase-panel">
          <div className="codebase-panel-header">
            <h3>
              Largest Files
            </h3>

            <span>
              Top 5
            </span>
          </div>

          {analysis.largestFiles
            .length === 0 ? (
            <div className="codebase-empty">
              File size information
              unavailable.
            </div>
          ) : (
            <div className="codebase-file-list">
              {analysis.largestFiles.map(
                (file) => (
                  <div
                    className="codebase-file"
                    key={file.path}
                  >
                    <div>
                      <strong>
                        {file.name}
                      </strong>

                      <small>
                        {file.path}
                      </small>
                    </div>

                    <span>
                      {formatBytes(
                        file.size
                      )}
                    </span>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* INSIGHT */}

      <div className="codebase-insight">
        <div className="codebase-insight-icon">
          i
        </div>

        <div>
          <span>
            REPOLENS INSIGHT
          </span>

          <p>
            {analysis.insight}
          </p>
        </div>
      </div>
    </section>
  );
}