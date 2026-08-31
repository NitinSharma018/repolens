import {
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  GitBranch,
  Search,
  Sparkles,
  GitFork,
  Star,
  Activity,
  Users,
  Code2,
  ExternalLink,
  AlertCircle,
  Eye,
  CircleDot,
  Scale,
  FileText,
  TrendingUp,
  Wrench,
  GitCommitHorizontal,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import ContributorIntelligence from "./components/ContributorIntelligence";
import IssuePRIntelligence from "./components/IssuePRIntelligence";
import CodebaseIntelligence from "./components/CodebaseIntelligence";

import {
  getGitHubUser,
  getGitHubRepository,
  getRepositoryLanguages,
  getRepositoryCommits,
  getRepositoryContents,
  type GitHubUser,
  type GitHubRepository,
  type GitHubCommit,
  type GitHubContent,
} from "./services/githubApi";

import "./index.css";

/* ================================================= */
/* TYPES                                             */
/* ================================================= */

type AnalysisType =
  | "profile"
  | "repository"
  | null;

type LanguageData = {
  name: string;
  bytes: number;
  percentage: number;
};

type HealthMetrics = {
  activity: number;
  maintenance: number;
  community: number;
  popularity: number;
  documentation: number;
  overall: number;
};

type ActivityData = {
  commitsLast30Days: number;
  lastCommitDate: string | null;
  daysSinceLastPush: number | null;
  chart: {
    date: string;
    commits: number;
  }[];
};

type DocumentationData = {
  score: number;
  readme: boolean;
  license: boolean;
  contributing: boolean;
  codeOfConduct: boolean;
};

type Insight = {
  type: "positive" | "warning";
  text: string;
};

/* ================================================= */
/* APP                                               */
/* ================================================= */

function App() {
  const [query, setQuery] = useState("");

  const [user, setUser] =
    useState<GitHubUser | null>(null);

  const [repository, setRepository] =
    useState<GitHubRepository | null>(
      null
    );

  const [languages, setLanguages] =
    useState<LanguageData[]>([]);

  const [commits, setCommits] =
    useState<GitHubCommit[]>([]);

  const [contents, setContents] =
    useState<GitHubContent[]>([]);

  const [analysisType, setAnalysisType] =
    useState<AnalysisType>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  /* ================================================= */
  /* ANALYZE                                           */
  /* ================================================= */

  const handleAnalyze = async () => {
    const value = query.trim();

    if (!value) {
      setError(
        "Please enter a GitHub username or repository URL."
      );

      clearResults();

      return;
    }

    setLoading(true);
    setError("");

    clearResults();

    try {
      const parsed =
        parseGitHubInput(value);

      if (
        parsed.type === "repository"
      ) {
        const since =
          getThirtyDaysAgo();

        const [
          repositoryData,
          languageData,
          commitData,
          contentData,
        ] = await Promise.all([
          getGitHubRepository(
            parsed.owner,
            parsed.repository
          ),

          getRepositoryLanguages(
            parsed.owner,
            parsed.repository
          ),

          getRepositoryCommits(
            parsed.owner,
            parsed.repository,
            since
          ),

          getRepositoryContents(
            parsed.owner,
            parsed.repository
          ),
        ]);

        setRepository(
          repositoryData
        );

        setLanguages(
          formatLanguages(
            languageData
          )
        );

        setCommits(
          commitData
        );

        setContents(
          contentData
        );

        setAnalysisType(
          "repository"
        );
      } else {
        const data =
          await getGitHubUser(
            parsed.username
          );

        setUser(data);

        setAnalysisType(
          "profile"
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while analyzing."
      );
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setUser(null);
    setRepository(null);
    setLanguages([]);
    setCommits([]);
    setContents([]);
    setAnalysisType(null);
  };

  return (
    <div className="app">
      {/* ================================================= */}
      {/* NAVBAR                                            */}
      {/* ================================================= */}

      <nav className="navbar">
        <div className="brand">
          <div className="brand-icon">
            <GitBranch size={22} />
          </div>

          <span>RepoLens</span>
        </div>

        <div className="nav-links">
          <a href="#features">
            Features
          </a>

          <a href="#about">
            About
          </a>
        </div>
      </nav>

      <main>
        {/* ================================================= */}
        {/* HERO                                              */}
        {/* ================================================= */}

        <section className="hero">
          <div className="hero-badge">
            <Sparkles size={15} />

            GitHub Repository Intelligence
          </div>

          <h1>
            Understand GitHub
            <br />

            <span>
              at a glance.
            </span>
          </h1>

          <p className="hero-description">
            Analyze GitHub profiles and
            repositories to discover activity,
            languages, health metrics, and
            meaningful insights.
          </p>

          {/* SEARCH */}

          <div className="search-wrapper">
            <div className="search-box">
              <Search size={21} />

              <input
                type="text"
                placeholder="Enter a GitHub username or repository URL"
                value={query}
                disabled={loading}
                onChange={(event) => {
                  setQuery(
                    event.target.value
                  );

                  setError("");
                }}
                onKeyDown={(event) => {
                  if (
                    event.key ===
                    "Enter"
                  ) {
                    handleAnalyze();
                  }
                }}
              />

              <button
                onClick={
                  handleAnalyze
                }
                disabled={loading}
              >
                {loading
                  ? "Analyzing..."
                  : "Analyze"}
              </button>
            </div>

            <p className="search-hint">
              Try: torvalds or facebook/react
            </p>

            {error && (
              <div className="error-message">
                <AlertCircle
                  size={17}
                />

                <span>
                  {error}
                </span>
              </div>
            )}
          </div>

          {/* PROFILE */}

          {analysisType ===
            "profile" &&
            user && (
              <ProfileResult
                user={user}
              />
            )}

          {/* REPOSITORY */}

          {analysisType ===
            "repository" &&
            repository && (
              <RepositoryResult
                repository={
                  repository
                }
                languages={
                  languages
                }
                commits={commits}
                contents={
                  contents
                }
              />
            )}
        </section>

        {/* ================================================= */}
        {/* FEATURES                                          */}
        {/* ================================================= */}

        <section
          className="preview-section"
          id="features"
        >
          <div className="section-heading">
            <span>
              EXAMPLE ANALYSIS
            </span>

            <h2>
              Everything important.
              One dashboard.
            </h2>
          </div>

          <div className="dashboard-preview">
            <div className="preview-header">
              <div>
                <p className="preview-label">
                  Repository
                </p>

                <h3>
                  facebook / react
                </h3>
              </div>

              <div className="health-score">
                <span>
                  Health
                </span>

                <strong>
                  94
                </strong>
              </div>
            </div>

            <div className="stats-grid">
              <StatCard
                icon={
                  <Star size={18} />
                }
                label="Stars"
                value="238K"
              />

              <StatCard
                icon={
                  <GitFork
                    size={18}
                  />
                }
                label="Forks"
                value="49.2K"
              />

              <StatCard
                icon={
                  <Activity
                    size={18}
                  />
                }
                label="Activity"
                value="High"
              />
            </div>

            <div className="preview-bottom">
              <div>
                <p className="preview-label">
                  Primary Language
                </p>

                <h4>
                  JavaScript
                </h4>
              </div>

              <div>
                <p className="preview-label">
                  Last Updated
                </p>

                <h4>
                  Recently
                </h4>
              </div>

              <div>
                <p className="preview-label">
                  Open Issues
                </p>

                <h4>
                  1,234
                </h4>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================= */}
        {/* ABOUT                                             */}
        {/* ================================================= */}

        <section
          className="about-section"
          id="about"
        >
          <div>
            <span className="section-eyebrow">
              WHY REPO LENS
            </span>

            <h2>
              Raw GitHub data is
              useful.
              <br />

              <span>
                Understanding it is
                better.
              </span>
            </h2>
          </div>

          <p>
            RepoLens transforms
            repository metadata into
            readable metrics,
            visualizations, and insights
            so developers can quickly
            understand the health,
            activity, and structure of
            a project.
          </p>
        </section>
      </main>
    </div>
  );
}

/* ================================================= */
/* PROFILE RESULT                                    */
/* ================================================= */

function ProfileResult({
  user,
}: {
  user: GitHubUser;
}) {
  return (
    <section className="profile-result">
      <div className="profile-header">
        <img
          src={user.avatar_url}
          alt={`${user.login} avatar`}
          className="profile-avatar"
        />

        <div className="profile-main-info">
          <p className="profile-label">
            GitHub Profile
          </p>

          <h2>
            {user.name ||
              user.login}
          </h2>

          <a
            href={
              user.html_url
            }
            target="_blank"
            rel="noreferrer"
            className="profile-link"
          >
            @{user.login}

            <ExternalLink
              size={13}
            />
          </a>
        </div>
      </div>

      {user.bio && (
        <p className="profile-bio">
          {user.bio}
        </p>
      )}

      <div className="profile-stats">
        <StatCard
          icon={
            <Code2 size={18} />
          }
          label="Repositories"
          value={user.public_repos.toLocaleString()}
        />

        <StatCard
          icon={
            <Users size={18} />
          }
          label="Followers"
          value={user.followers.toLocaleString()}
        />

        <StatCard
          icon={
            <Users size={18} />
          }
          label="Following"
          value={user.following.toLocaleString()}
        />

        <StatCard
          icon={
            <Activity
              size={18}
            />
          }
          label="Public Gists"
          value={user.public_gists.toLocaleString()}
        />
      </div>

      <div className="profile-footer">
        <div>
          <span>
            Member since
          </span>

          <strong>
            {formatDate(
              user.created_at
            )}
          </strong>
        </div>

        <div>
          <span>
            Last profile update
          </span>

          <strong>
            {formatDate(
              user.updated_at
            )}
          </strong>
        </div>
      </div>
    </section>
  );
}

/* ================================================= */
/* REPOSITORY RESULT                                 */
/* ================================================= */

function RepositoryResult({
  repository,
  languages,
  commits,
  contents,
}: {
  repository: GitHubRepository;

  languages: LanguageData[];

  commits: GitHubCommit[];

  contents: GitHubContent[];
}) {
  const activity =
    useMemo(
      () =>
        calculateActivity(
          repository,
          commits
        ),
      [
        repository,
        commits,
      ]
    );

  const documentation =
    useMemo(
      () =>
        calculateDocumentation(
          repository,
          contents
        ),
      [
        repository,
        contents,
      ]
    );

  const health =
    useMemo(
      () =>
        calculateHealth(
          repository,
          activity,
          documentation
        ),
      [
        repository,
        activity,
        documentation,
      ]
    );

  const insights =
    useMemo(
      () =>
        generateInsights(
          repository,
          activity,
          documentation,
          health
        ),
      [
        repository,
        activity,
        documentation,
        health,
      ]
    );

  return (
    <section className="repository-result">
      {/* HEADER */}

      <div className="repository-header">
        <div className="repository-owner">
          <img
            src={
              repository.owner
                .avatar_url
            }
            alt={`${repository.owner.login} avatar`}
          />

          <div>
            <p className="profile-label">
              GitHub Repository
            </p>

            <h2>
              {repository.name}
            </h2>

            <a
              href={
                repository.html_url
              }
              target="_blank"
              rel="noreferrer"
              className="profile-link"
            >
              {
                repository.full_name
              }

              <ExternalLink
                size={13}
              />
            </a>
          </div>
        </div>

        <div className="repository-visibility">
          {repository.private
            ? "Private"
            : "Public"}
        </div>
      </div>

      {/* DESCRIPTION */}

      {repository.description && (
        <p className="repository-description">
          {
            repository.description
          }
        </p>
      )}

      {/* STATS */}

      <div className="repository-stats">
        <StatCard
          icon={
            <Star size={18} />
          }
          label="Stars"
          value={formatNumber(
            repository.stargazers_count
          )}
        />

        <StatCard
          icon={
            <GitFork
              size={18}
            />
          }
          label="Forks"
          value={formatNumber(
            repository.forks_count
          )}
        />

        <StatCard
          icon={
            <Eye size={18} />
          }
          label="Watchers"
          value={formatNumber(
            repository.watchers_count
          )}
        />

        <StatCard
          icon={
            <CircleDot
              size={18}
            />
          }
          label="Open Issues"
          value={formatNumber(
            repository.open_issues_count
          )}
        />
      </div>

      {/* DETAILS */}

      <div className="repository-details">
        <DetailItem
          label="Primary Language"
          value={
            repository.language ||
            "Not specified"
          }
        />

        <DetailItem
          label="Default Branch"
          value={
            repository.default_branch
          }
        />

        <DetailItem
          label="License"
          value={
            repository.license
              ?.name ||
            "Not specified"
          }
        />

        <DetailItem
          label="Last Updated"
          value={formatDateTime(
            repository.updated_at
          )}
        />
      </div>

      {/* LANGUAGE ANALYTICS */}

      <LanguageAnalytics
        languages={languages}
      />

      {/* HEALTH */}

      <HealthSection
        health={health}
      />

      {/* ACTIVITY */}

      <ActivitySection
        activity={activity}
        commits={commits}
      />

      {/* CONTRIBUTOR INTELLIGENCE */}

<ContributorIntelligence
  owner={repository.owner.login}
  repository={repository.name}
/>

<IssuePRIntelligence
  owner={repository.owner.login}
  repository={repository.name}
/>

<CodebaseIntelligence
  owner={repository.owner.login}
  repository={repository.name}
/>
      {/* DOCUMENTATION */}

      <DocumentationSection
        documentation={
          documentation
        }
      />

      {/* INSIGHTS */}

      <InsightsSection
        insights={insights}
      />

      {/* TOPICS */}

      {repository.topics
        .length > 0 && (
        <div className="topics-section">
          <p className="preview-label">
            Repository Topics
          </p>

          <div className="topics-list">
            {repository.topics.map(
              (topic) => (
                <span
                  className="topic"
                  key={topic}
                >
                  {topic}
                </span>
              )
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}

      <div className="repository-footer">
        <div>
          <Scale size={15} />

          <span>
            Created{" "}
            {formatDate(
              repository.created_at
            )}
          </span>
        </div>

        <div>
          <Activity
            size={15}
          />

          <span>
            Last push{" "}
            {repository.pushed_at
              ? formatDateTime(
                  repository.pushed_at
                )
              : "Unavailable"}
          </span>
        </div>
      </div>
    </section>
  );
}

/* ================================================= */
/* LANGUAGE ANALYTICS                                */
/* ================================================= */

function LanguageAnalytics({
  languages,
}: {
  languages: LanguageData[];
}) {
  if (
    languages.length === 0
  ) {
    return (
      <div className="language-section">
        <div className="analytics-heading">
          <div>
            <p className="preview-label">
              Language Analytics
            </p>

            <h3>
              No language data
              available
            </h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="language-section">
      <div className="analytics-heading">
        <div>
          <p className="preview-label">
            Language Analytics
          </p>

          <h3>
            Code composition
          </h3>
        </div>

        <span className="language-count">
          {languages.length}{" "}
          detected
        </span>
      </div>

      <div className="language-content">
        <div className="language-chart">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <PieChart>
              <Pie
                data={languages}
                dataKey="bytes"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={105}
                paddingAngle={3}
              >
                {languages.map(
                  (
                    language,
                    index
                  ) => (
                    <Cell
                      key={
                        language.name
                      }
                      fill={getChartColor(
                        index
                      )}
                    />
                  )
                )}
              </Pie>

              <Tooltip
                formatter={(value) => [
                typeof value === "number"
                 ? formatBytes(value)
                : "0 bytes",
                "Code",
               ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="language-list">
          {languages.map(
            (
              language,
              index
            ) => (
              <div
                className="language-item"
                key={
                  language.name
                }
              >
                <div className="language-name">
                  <span
                    className="language-dot"
                    style={{
                      background:
                        getChartColor(
                          index
                        ),
                    }}
                  />

                  <span>
                    {
                      language.name
                    }
                  </span>
                </div>

                <div className="language-value">
                  <strong>
                    {language.percentage.toFixed(
                      1
                    )}
                    %
                  </strong>

                  <span>
                    {formatBytes(
                      language.bytes
                    )}
                  </span>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================================= */
/* HEALTH SECTION                                    */
/* ================================================= */

function HealthSection({
  health,
}: {
  health: HealthMetrics;
}) {
  return (
    <div className="health-section">
      <div className="health-header">
        <div>
          <p className="preview-label">
            Repository Health
          </p>

          <h3>
            Overall project health
          </h3>
        </div>

        <div className="health-number">
          <strong>
            {health.overall}
          </strong>

          <span>/ 100</span>
        </div>
      </div>

      <div className="health-grid">
        <HealthMetric
          label="Activity"
          value={
            health.activity
          }
          icon={
            <Activity
              size={15}
            />
          }
        />

        <HealthMetric
          label="Maintenance"
          value={
            health.maintenance
          }
          icon={
            <Wrench
              size={15}
            />
          }
        />

        <HealthMetric
          label="Community"
          value={
            health.community
          }
          icon={
            <Users
              size={15}
            />
          }
        />

        <HealthMetric
          label="Popularity"
          value={
            health.popularity
          }
          icon={
            <TrendingUp
              size={15}
            />
          }
        />

        <HealthMetric
          label="Documentation"
          value={
            health.documentation
          }
          icon={
            <FileText
              size={15}
            />
          }
        />
      </div>

      <div className="score-method">
        <span>
          Score model
        </span>

        <span>
          Activity 25% ·
          Maintenance 25% ·
          Community 20% ·
          Popularity 15% ·
          Documentation 15%
        </span>
      </div>
    </div>
  );
}

/* ================================================= */
/* HEALTH METRIC                                     */
/* ================================================= */

function HealthMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: ReactNode;
}) {
  return (
    <div className="health-metric">
      <div className="health-metric-top">
        <div className="health-label">
          <span className="health-icon">
            {icon}
          </span>

          <span>
            {label}
          </span>
        </div>

        <strong>
          {value}
        </strong>
      </div>

      <div className="progress-track">
        <div
          className="progress-fill"
          style={{
            width: `${value}%`,
          }}
        />
      </div>
    </div>
  );
}

/* ================================================= */
/* ACTIVITY SECTION                                  */
/* ================================================= */

function ActivitySection({
  activity,
  commits,
}: {
  activity: ActivityData;
  commits: GitHubCommit[];
}) {
  return (
    <div className="activity-section">
      <div className="analytics-heading">
        <div>
          <p className="preview-label">
            Activity Analysis
          </p>

          <h3>
            Recent development activity
          </h3>
        </div>

        <span className="language-count">
          Last 30 days
        </span>
      </div>

      {/* ACTIVITY STATS */}

      <div className="activity-grid">
        <div className="activity-stat">
          <div className="activity-stat-icon">
            <GitCommitHorizontal
              size={16}
            />
          </div>

          <span>
            Commits
          </span>

          <strong>
            {
              activity.commitsLast30Days
            }
          </strong>

          <small>
            detected in 30 days
          </small>
        </div>

        <div className="activity-stat">
          <div className="activity-stat-icon">
            <Activity
              size={16}
            />
          </div>

          <span>
            Last commit
          </span>

          <strong>
            {activity.lastCommitDate
              ? formatRelativeDate(
                  activity.lastCommitDate
                )
              : "Unknown"}
          </strong>

          <small>
            latest detected activity
          </small>
        </div>

        <div className="activity-stat">
          <div className="activity-stat-icon">
            <TrendingUp
              size={16}
            />
          </div>

          <span>
            Last push
          </span>

          <strong>
            {activity.daysSinceLastPush ===
            null
              ? "Unknown"
              : activity.daysSinceLastPush ===
                0
              ? "Today"
              : `${activity.daysSinceLastPush}d ago`}
          </strong>

          <small>
            repository update
          </small>
        </div>
      </div>

      {/* CHART */}

      <div className="activity-chart-wrapper">
        <div className="activity-chart-header">
          <p className="preview-label">
            Commit frequency
          </p>

          <span>
            Daily activity
          </span>
        </div>

        <div className="activity-chart">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <BarChart
              data={
                activity.chart
              }
              margin={{
                top: 10,
                right: 5,
                left: -20,
                bottom: 5,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="rgba(255,255,255,0.06)"
              />

              <XAxis
                dataKey="date"
                tick={{
                  fill: "#65656c",
                  fontSize: 9,
                }}
                tickLine={false}
                axisLine={false}
                interval={4}
              />

              <YAxis
                allowDecimals={false}
                tick={{
                  fill: "#65656c",
                  fontSize: 9,
                }}
                tickLine={false}
                axisLine={false}
              />

              <Tooltip
                cursor={{
                  fill: "rgba(255,255,255,0.025)",
                }}
                contentStyle={{
                  background:
                    "#171719",
                  border:
                    "1px solid rgba(255,255,255,0.1)",
                  borderRadius:
                    "10px",
                }}
                labelStyle={{
                  color: "#bdbdc2",
                }}
              />

              <Bar
                dataKey="commits"
                fill="#cfcfd3"
                radius={[
                  4,
                  4,
                  0,
                  0,
                ]}
                maxBarSize={12}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* RECENT COMMITS */}

      <div className="recent-commits">
        <p className="preview-label">
          Recent commits
        </p>

        {commits.length ===
        0 ? (
          <div className="empty-activity">
            No recent commits
            detected.
          </div>
        ) : (
          commits
            .slice(0, 5)
            .map((commit) => (
              <a
                key={
                  commit.sha
                }
                href={
                  commit.html_url
                }
                target="_blank"
                rel="noreferrer"
                className="commit-row"
              >
                <div className="commit-icon">
                  <GitBranch
                    size={14}
                  />
                </div>

                <div className="commit-content">
                  <strong>
                    {cleanCommitMessage(
                      commit
                        .commit
                        .message
                    )}
                  </strong>

                  <span>
                    {commit.author
                      ?.login ||
                      commit
                        .commit
                        .author
                        ?.name ||
                      "Unknown author"}
                  </span>
                </div>

                <span className="commit-date">
                  {formatRelativeDate(
                    commit
                      .commit
                      .author
                      ?.date ||
                      ""
                  )}
                </span>
              </a>
            ))
        )}
      </div>
    </div>
  );
}

/* ================================================= */
/* DOCUMENTATION                                     */
/* ================================================= */

function DocumentationSection({
  documentation,
}: {
  documentation: DocumentationData;
}) {
  return (
    <div className="documentation-section">
      <div className="analytics-heading">
        <div>
          <p className="preview-label">
            Documentation
          </p>

          <h3>
            Project documentation
            signals
          </h3>
        </div>

        <div className="documentation-score">
          {documentation.score}/100
        </div>
      </div>

      <div className="documentation-grid">
        <DocumentationItem
          label="README"
          present={
            documentation.readme
          }
        />

        <DocumentationItem
          label="License"
          present={
            documentation.license
          }
        />

        <DocumentationItem
          label="Contributing"
          present={
            documentation.contributing
          }
        />

        <DocumentationItem
          label="Code of Conduct"
          present={
            documentation.codeOfConduct
          }
        />
      </div>
    </div>
  );
}

/* ================================================= */
/* DOCUMENTATION ITEM                                */
/* ================================================= */

function DocumentationItem({
  label,
  present,
}: {
  label: string;
  present: boolean;
}) {
  return (
    <div className="documentation-item">
      <div>
        {present ? (
          <CheckCircle2
            size={16}
          />
        ) : (
          <AlertTriangle
            size={16}
          />
        )}
      </div>

      <span>
        {label}
      </span>

      <strong
        className={
          present
            ? "status-present"
            : "status-missing"
        }
      >
        {present
          ? "Present"
          : "Missing"}
      </strong>
    </div>
  );
}

/* ================================================= */
/* INSIGHTS                                          */
/* ================================================= */

function InsightsSection({
  insights,
}: {
  insights: Insight[];
}) {
  return (
    <div className="insights-section">
      <div className="analytics-heading">
        <div>
          <p className="preview-label">
            RepoLens Insights
          </p>

          <h3>
            What the data suggests
          </h3>
        </div>
      </div>

      <div className="insights-list">
        {insights.map(
          (
            insight,
            index
          ) => (
            <div
              key={`${insight.text}-${index}`}
              className={`insight-item ${insight.type}`}
            >
              <div className="insight-icon">
                {insight.type ===
                "positive"
                  ? "✓"
                  : "!"}
              </div>

              <span>
                {insight.text}
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
}

/* ================================================= */
/* DETAIL ITEM                                       */
/* ================================================= */

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="detail-item">
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

/* ================================================= */
/* STAT CARD                                         */
/* ================================================= */

function StatCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-icon">
        {icon}
      </div>

      <div>
        <p>
          {label}
        </p>

        <strong>
          {value}
        </strong>
      </div>
    </div>
  );
}

/* ================================================= */
/* INPUT PARSER                                      */
/* ================================================= */

function parseGitHubInput(
  value: string
):
  | {
      type: "profile";
      username: string;
    }
  | {
      type: "repository";
      owner: string;
      repository: string;
    } {
  let input =
    value.trim();

  input = input.replace(
    /^https?:\/\//,
    ""
  );

  input = input.replace(
    /^www\./,
    ""
  );

  if (
    input.startsWith(
      "github.com/"
    )
  ) {
    input =
      input.substring(
        "github.com/"
          .length
      );
  }

  input =
    input.split("?")[0];

  input =
    input.split("#")[0];

  const parts =
    input
      .split("/")
      .filter(Boolean);

  if (
    parts.length >= 2
  ) {
    return {
      type: "repository",

      owner: parts[0],

      repository:
        parts[1].replace(
          /\.git$/,
          ""
        ),
    };
  }

  return {
    type: "profile",

    username:
      parts[0],
  };
}

/* ================================================= */
/* ACTIVITY CALCULATION                              */
/* ================================================= */

function calculateActivity(
  repository: GitHubRepository,
  commits: GitHubCommit[]
): ActivityData {
  const now =
    new Date();

  const lastCommitDate =
    commits.length > 0
      ? commits[0].commit
          .author?.date ||
        commits[0].commit
          .committer?.date ||
        null
      : null;

  const pushDate =
    repository.pushed_at
      ? new Date(
          repository.pushed_at
        )
      : null;

  const daysSinceLastPush =
    pushDate
      ? Math.max(
          0,
          Math.floor(
            (
              now.getTime() -
              pushDate.getTime()
            ) /
              86_400_000
          )
        )
      : null;

  const chart =
    createActivityChart(
      commits
    );

  return {
    commitsLast30Days:
      commits.length,

    lastCommitDate,

    daysSinceLastPush,

    chart,
  };
}

/* ================================================= */
/* ACTIVITY CHART                                    */
/* ================================================= */

function createActivityChart(
  commits: GitHubCommit[]
) {
  const today =
    new Date();

  const days: {
    date: string;
    commits: number;
  }[] = [];

  for (
    let i = 29;
    i >= 0;
    i--
  ) {
    const date =
      new Date(
        today
      );

    date.setDate(
      today.getDate() -
        i
    );

    const key =
      getDateKey(date);

    const count =
      commits.filter(
        (commit) => {
          const commitDate =
            commit.commit
              .author
              ?.date ||
            commit.commit
              .committer
              ?.date;

          if (!commitDate) {
            return false;
          }

          return (
            getDateKey(
              new Date(
                commitDate
              )
            ) === key
          );
        }
      ).length;

    days.push({
      date: formatChartDate(
        date
      ),

      commits: count,
    });
  }

  return days;
}

/* ================================================= */
/* DOCUMENTATION CALCULATION                         */
/* ================================================= */

function calculateDocumentation(
  repository: GitHubRepository,
  contents: GitHubContent[]
): DocumentationData {
  const names =
    contents.map(
      (item) =>
        item.name.toLowerCase()
    );

  const readme =
    names.some(
      (name) =>
        name ===
          "readme.md" ||
        name === "readme"
    );

  const license =
    Boolean(
      repository.license
    ) ||
    names.some(
      (name) =>
        name.startsWith(
          "license"
        )
    );

  const contributing =
    names.some(
      (name) =>
        name ===
          "contributing.md" ||
        name ===
          "contributing"
    );

  const codeOfConduct =
    names.some(
      (name) =>
        name ===
          "code_of_conduct.md" ||
        name ===
          "code-of-conduct.md" ||
        name ===
          "codeofconduct.md"
    );

  let score = 0;

  if (readme) {
    score += 40;
  }

  if (license) {
    score += 25;
  }

  if (contributing) {
    score += 20;
  }

  if (codeOfConduct) {
    score += 15;
  }

  return {
    score,
    readme,
    license,
    contributing,
    codeOfConduct,
  };
}

/* ================================================= */
/* HEALTH ENGINE                                     */
/* ================================================= */

function calculateHealth(
  repository: GitHubRepository,
  activity: ActivityData,
  documentation: DocumentationData
): HealthMetrics {
  /*
   * ACTIVITY
   *
   * Recent commits + recent push.
   */

  let activityScore =
    20;

  if (
    activity.commitsLast30Days >=
    30
  ) {
    activityScore +=
      60;
  } else {
    activityScore +=
      activity.commitsLast30Days *
      2;
  }

  if (
    activity.daysSinceLastPush !==
      null
  ) {
    if (
      activity.daysSinceLastPush <=
      3
    ) {
      activityScore +=
        20;
    } else if (
      activity.daysSinceLastPush <=
      7
    ) {
      activityScore +=
        15;
    } else if (
      activity.daysSinceLastPush <=
      30
    ) {
      activityScore +=
        10;
    }
  }

  activityScore =
    clamp(
      activityScore,
      0,
      100
    );

  /*
   * MAINTENANCE
   */

  let maintenanceScore =
    45;

  if (
    activity.daysSinceLastPush !==
      null
  ) {
    if (
      activity.daysSinceLastPush <=
      7
    ) {
      maintenanceScore +=
        50;
    } else if (
      activity.daysSinceLastPush <=
      30
    ) {
      maintenanceScore +=
        35;
    } else if (
      activity.daysSinceLastPush <=
      90
    ) {
      maintenanceScore +=
        20;
    } else if (
      activity.daysSinceLastPush <=
      180
    ) {
      maintenanceScore +=
        5;
    } else {
      maintenanceScore -=
        25;
    }
  }

  maintenanceScore =
    clamp(
      maintenanceScore,
      0,
      100
    );

  /*
   * COMMUNITY
   *
   * Forks + issue participation.
   */

  const forkSignal =
    Math.min(
      50,
      Math.log10(
        repository
          .forks_count +
          1
      ) * 15
    );

  const issueSignal =
    repository.open_issues_count >
    0
      ? 15
      : 8;

  const communityScore =
    clamp(
      30 +
        forkSignal +
        issueSignal,
      0,
      100
    );

  /*
   * POPULARITY
   */

  const popularityScore =
    clamp(
      Math.log10(
        repository
          .stargazers_count +
          1
      ) * 25,
      0,
      100
    );

  /*
   * OVERALL
   */

  const overall =
    Math.round(
      activityScore *
        0.25 +
        maintenanceScore *
          0.25 +
        communityScore *
          0.2 +
        popularityScore *
          0.15 +
        documentation.score *
          0.15
    );

  return {
    activity:
      Math.round(
        activityScore
      ),

    maintenance:
      Math.round(
        maintenanceScore
      ),

    community:
      Math.round(
        communityScore
      ),

    popularity:
      Math.round(
        popularityScore
      ),

    documentation:
      documentation.score,

    overall:
      clamp(
        overall,
        0,
        100
      ),
  };
}

/* ================================================= */
/* INSIGHTS                                          */
/* ================================================= */

function generateInsights(
  repository: GitHubRepository,
  activity: ActivityData,
  documentation: DocumentationData,
  health: HealthMetrics
): Insight[] {
  const insights: Insight[] =
    [];

  if (
    activity.commitsLast30Days >=
    15
  ) {
    insights.push({
      type: "positive",

      text:
        "Strong development activity was detected during the last 30 days.",
    });
  } else if (
    activity.commitsLast30Days >=
    3
  ) {
    insights.push({
      type: "positive",

      text:
        "The repository shows recent development activity.",
    });
  } else {
    insights.push({
      type: "warning",

      text:
        "Limited commit activity was detected during the last 30 days.",
    });
  }

  if (
    activity.daysSinceLastPush !==
      null &&
    activity.daysSinceLastPush <=
      30
  ) {
    insights.push({
      type: "positive",

      text:
        "Recent pushes suggest the repository is actively maintained.",
    });
  } else {
    insights.push({
      type: "warning",

      text:
        "The repository has not received a recent push.",
    });
  }

  if (
    repository.stargazers_count >=
    1000
  ) {
    insights.push({
      type: "positive",

      text:
        "The repository has significant community visibility.",
    });
  }

  if (
    repository.forks_count >=
    100
  ) {
    insights.push({
      type: "positive",

      text:
        "Fork activity indicates meaningful community usage.",
    });
  }

  if (
    documentation.score >=
    70
  ) {
    insights.push({
      type: "positive",

      text:
        "Good documentation signals are present.",
    });
  } else {
    insights.push({
      type: "warning",

      text:
        "Documentation coverage could be improved.",
    });
  }

  if (
    health.overall >=
    80
  ) {
    insights.push({
      type: "positive",

      text:
        "Overall repository health is strong.",
    });
  } else if (
    health.overall < 50
  ) {
    insights.push({
      type: "warning",

      text:
        "Several repository health signals are relatively weak.",
    });
  }

  return insights.slice(
    0,
    5
  );
}

/* ================================================= */
/* HELPERS                                           */
/* ================================================= */

function getThirtyDaysAgo() {
  const date =
    new Date();

  date.setDate(
    date.getDate() - 30
  );

  return date.toISOString();
}

function getDateKey(
  date: Date
) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatChartDate(
  date: Date
) {
  return new Intl.DateTimeFormat(
    "en-US",
    {
      month: "short",
      day: "numeric",
    }
  ).format(date);
}

function clamp(
  value: number,
  min: number,
  max: number
) {
  return Math.min(
    Math.max(
      value,
      min
    ),
    max
  );
}

function formatLanguages(
  languageData: Record<
    string,
    number
  >
): LanguageData[] {
  const entries =
    Object.entries(
      languageData
    );

  const total =
    entries.reduce(
      (
        sum,
        [, bytes]
      ) =>
        sum + bytes,
      0
    );

  if (
    total === 0
  ) {
    return [];
  }

  return entries
    .map(
      ([
        name,
        bytes,
      ]) => ({
        name,
        bytes,

        percentage:
          (bytes /
            total) *
          100,
      })
    )
    .sort(
      (a, b) =>
        b.bytes -
        a.bytes
    );
}

function getChartColor(
  index: number
) {
  const colors = [
    "#61dafb",
    "#3178c6",
    "#f7df1e",
    "#a8b9cc",
    "#563d7c",
    "#e34c26",
    "#00add8",
    "#3572A5",
  ];

  return colors[
    index %
      colors.length
  ];
}

function formatNumber(
  value: number
) {
  if (
    value >=
    1_000_000
  ) {
    return `${(
      value /
      1_000_000
    ).toFixed(1)}M`;
  }

  if (
    value >=
    1_000
  ) {
    return `${(
      value /
      1_000
    ).toFixed(1)}K`;
  }

  return value.toLocaleString();
}

function formatBytes(
  bytes: number
) {
  if (
    bytes < 1024
  ) {
    return `${bytes} B`;
  }

  if (
    bytes <
    1024 * 1024
  ) {
    return `${(
      bytes /
      1024
    ).toFixed(1)} KB`;
  }

  if (
    bytes <
    1024 *
      1024 *
      1024
  ) {
    return `${(
      bytes /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  }

  return `${(
    bytes /
    (1024 *
      1024 *
      1024)
  ).toFixed(1)} GB`;
}

function formatDate(
  date: string
) {
  return new Intl.DateTimeFormat(
    "en-US",
    {
      month: "short",
      year: "numeric",
    }
  ).format(
    new Date(date)
  );
}

function formatDateTime(
  date: string
) {
  return new Intl.DateTimeFormat(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  ).format(
    new Date(date)
  );
}

function formatRelativeDate(
  date: string
) {
  if (!date) {
    return "Unknown";
  }

  const target =
    new Date(date);

  const now =
    new Date();

  const difference =
    Math.floor(
      (
        now.getTime() -
        target.getTime()
      ) /
        86_400_000
    );

  if (
    difference <= 0
  ) {
    return "Today";
  }

  if (
    difference === 1
  ) {
    return "Yesterday";
  }

  if (
    difference < 30
  ) {
    return `${difference}d ago`;
  }

  return formatDate(
    date
  );
}

function cleanCommitMessage(
  message: string
) {
  return message
    .split("\n")[0]
    .slice(0, 80);
}

export default App;