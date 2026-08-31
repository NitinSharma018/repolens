import type {
  GitHubCommit,
  GitHubIssue,
  GitHubPullRequest,
} from "../services/githubApi";

/* ================================================= */
/* TYPES                                             */
/* ================================================= */

export type RepositoryHealthLevel =
  | "HEALTHY"
  | "WATCH"
  | "AT RISK";

export type RepositoryHealthSummary = {
  score: number;
  level: RepositoryHealthLevel;

  activityScore: number;
  maintenanceScore: number;
  collaborationScore: number;
  stabilityScore: number;

  recentCommits: number;
  openIssues: number;
  staleIssues: number;

  openPullRequests: number;
  stalePullRequests: number;

  mergedPullRequests: number;

  commitActivity: "HIGH" | "MODERATE" | "LOW";
  issueBacklog: "LOW" | "MODERATE" | "HIGH";
  pullRequestBacklog: "LOW" | "MODERATE" | "HIGH";

  risks: string[];
  recommendations: string[];

  insight: string;
};

/* ================================================= */
/* CONSTANTS                                         */
/* ================================================= */

const RECENT_DAYS = 30;
const STALE_DAYS = 30;

/* ================================================= */
/* DATE HELPERS                                      */
/* ================================================= */

function getDaysSince(date: string): number {
  const timestamp = new Date(date).getTime();

  if (Number.isNaN(timestamp)) {
    return 9999;
  }

  return Math.floor(
    (Date.now() - timestamp) /
      (1000 * 60 * 60 * 24)
  );
}

function isRecent(date: string): boolean {
  return getDaysSince(date) <= RECENT_DAYS;
}

function isStale(date: string): boolean {
  return getDaysSince(date) >= STALE_DAYS;
}

/* ================================================= */
/* CLASSIFIERS                                       */
/* ================================================= */

function getCommitActivity(
  recentCommits: number
): "HIGH" | "MODERATE" | "LOW" {
  if (recentCommits >= 20) {
    return "HIGH";
  }

  if (recentCommits >= 5) {
    return "MODERATE";
  }

  return "LOW";
}

function getBacklogLevel(
  count: number,
  moderateLimit: number,
  highLimit: number
): "LOW" | "MODERATE" | "HIGH" {
  if (count >= highLimit) {
    return "HIGH";
  }

  if (count >= moderateLimit) {
    return "MODERATE";
  }

  return "LOW";
}

function getHealthLevel(
  score: number
): RepositoryHealthLevel {
  if (score >= 75) {
    return "HEALTHY";
  }

  if (score >= 50) {
    return "WATCH";
  }

  return "AT RISK";
}

/* ================================================= */
/* INSIGHT                                           */
/* ================================================= */

function generateInsight(
  score: number,
  recentCommits: number,
  staleIssues: number,
  stalePullRequests: number,
  openIssues: number,
  openPullRequests: number
): string {
  if (score >= 75) {
    return "Repository activity and maintenance signals appear healthy, with no major engineering risk detected.";
  }

  if (
    stalePullRequests > 0 &&
    stalePullRequests >=
      Math.max(1, openPullRequests / 2)
  ) {
    return "Pull request maintenance is the strongest current concern and may indicate review or delivery bottlenecks.";
  }

  if (
    staleIssues > 0 &&
    staleIssues >=
      Math.max(1, openIssues / 2)
  ) {
    return "A significant portion of the issue backlog appears stale and may require maintenance attention.";
  }

  if (recentCommits < 5) {
    return "Recent development activity is relatively low and the repository may need closer monitoring.";
  }

  if (score < 50) {
    return "Multiple repository health signals indicate elevated engineering risk and should be reviewed.";
  }

  return "Repository health is moderate; some maintenance or workflow improvements may be beneficial.";
}

/* ================================================= */
/* MAIN ANALYSIS                                     */
/* ================================================= */

export function analyzeRepositoryHealth(
  commits: GitHubCommit[],
  issues: GitHubIssue[],
  pullRequests: GitHubPullRequest[]
): RepositoryHealthSummary {
  /*
   * GitHub's Issues API can include pull requests,
   * so remove those entries before calculating
   * the actual issue backlog.
   */
  const realIssues = issues.filter(
    (issue) => !issue.pull_request
  );

  /* ================================================= */
  /* RECENT ACTIVITY                                   */
  /* ================================================= */

  const recentCommits = commits.filter(
    (commit) =>
      commit.commit?.author?.date
        ? isRecent(
            commit.commit.author.date
          )
        : false
  ).length;

  /* ================================================= */
  /* ISSUE HEALTH                                      */
  /* ================================================= */

  const openIssues = realIssues.filter(
    (issue) => issue.state === "open"
  ).length;

  const staleIssues = realIssues.filter(
    (issue) =>
      issue.state === "open" &&
      isStale(issue.updated_at)
  ).length;

  /* ================================================= */
  /* PULL REQUEST HEALTH                               */
  /* ================================================= */

  const openPullRequests =
    pullRequests.filter(
      (pullRequest) =>
        pullRequest.state === "open"
    ).length;

  const stalePullRequests =
    pullRequests.filter(
      (pullRequest) =>
        pullRequest.state === "open" &&
        isStale(
          pullRequest.updated_at
        )
    ).length;

  const mergedPullRequests =
    pullRequests.filter(
      (pullRequest) =>
        pullRequest.merged_at !== null
    ).length;

  /* ================================================= */
  /* ACTIVITY SCORE                                    */
  /* ================================================= */

  let activityScore = 100;

  if (recentCommits === 0) {
    activityScore = 20;
  } else if (recentCommits < 5) {
    activityScore = 45;
  } else if (recentCommits < 20) {
    activityScore = 70;
  }

  /* ================================================= */
  /* MAINTENANCE SCORE                                 */
  /* ================================================= */

  let maintenanceScore = 100;

  if (openIssues >= 50) {
    maintenanceScore -= 40;
  } else if (openIssues >= 20) {
    maintenanceScore -= 25;
  } else if (openIssues >= 10) {
    maintenanceScore -= 10;
  }

  if (staleIssues > 0) {
    const staleIssueRatio =
      openIssues > 0
        ? staleIssues / openIssues
        : 0;

    if (staleIssueRatio >= 0.5) {
      maintenanceScore -= 35;
    } else if (
      staleIssueRatio >= 0.25
    ) {
      maintenanceScore -= 20;
    } else {
      maintenanceScore -= 10;
    }
  }

  maintenanceScore = Math.max(
    0,
    maintenanceScore
  );

  /* ================================================= */
  /* COLLABORATION SCORE                               */
  /* ================================================= */

  let collaborationScore = 100;

  if (openPullRequests >= 20) {
    collaborationScore -= 35;
  } else if (openPullRequests >= 10) {
    collaborationScore -= 20;
  } else if (openPullRequests >= 5) {
    collaborationScore -= 10;
  }

  if (stalePullRequests > 0) {
    const stalePRRatio =
      openPullRequests > 0
        ? stalePullRequests /
          openPullRequests
        : 0;

    if (stalePRRatio >= 0.5) {
      collaborationScore -= 35;
    } else if (
      stalePRRatio >= 0.25
    ) {
      collaborationScore -= 20;
    } else {
      collaborationScore -= 10;
    }
  }

  collaborationScore = Math.max(
    0,
    collaborationScore
  );

  /* ================================================= */
  /* STABILITY SCORE                                   */
  /* ================================================= */

  let stabilityScore = 100;

  if (
    openIssues >= 20 &&
    openPullRequests >= 10
  ) {
    stabilityScore -= 30;
  } else if (
    openIssues >= 10 ||
    openPullRequests >= 5
  ) {
    stabilityScore -= 15;
  }

  if (
    staleIssues > 0 &&
    stalePullRequests > 0
  ) {
    stabilityScore -= 15;
  }

  stabilityScore = Math.max(
    0,
    stabilityScore
  );

  /* ================================================= */
  /* OVERALL SCORE                                     */
  /* ================================================= */

  const score = Math.round(
    activityScore * 0.25 +
      maintenanceScore * 0.30 +
      collaborationScore * 0.25 +
      stabilityScore * 0.20
  );

  const level = getHealthLevel(score);

  /* ================================================= */
  /* CLASSIFICATIONS                                   */
  /* ================================================= */

  const commitActivity =
    getCommitActivity(
      recentCommits
    );

  const issueBacklog =
    getBacklogLevel(
      openIssues,
      10,
      20
    );

  const pullRequestBacklog =
    getBacklogLevel(
      openPullRequests,
      5,
      10
    );

  /* ================================================= */
  /* RISKS                                             */
  /* ================================================= */

  const risks: string[] = [];

  if (recentCommits < 5) {
    risks.push(
      "Low recent commit activity may indicate reduced development momentum."
    );
  }

  if (openIssues >= 20) {
    risks.push(
      "The repository has a high open-issue backlog."
    );
  }

  if (staleIssues > 0) {
    risks.push(
      `${staleIssues} open issue${
        staleIssues === 1 ? "" : "s"
      } appear stale.`
    );
  }

  if (openPullRequests >= 10) {
    risks.push(
      "The repository has a high open pull-request backlog."
    );
  }

  if (stalePullRequests > 0) {
    risks.push(
      `${stalePullRequests} open pull request${
        stalePullRequests === 1
          ? ""
          : "s"
      } appear stale.`
    );
  }

  if (risks.length === 0) {
    risks.push(
      "No major repository health risks detected."
    );
  }

  /* ================================================= */
  /* RECOMMENDATIONS                                   */
  /* ================================================= */

  const recommendations: string[] = [];

  if (recentCommits < 5) {
    recommendations.push(
      "Review recent development activity and identify inactive areas."
    );
  }

  if (staleIssues > 0) {
    recommendations.push(
      "Review stale issues and close, update, or prioritize them."
    );
  }

  if (stalePullRequests > 0) {
    recommendations.push(
      "Review stale pull requests to reduce review backlog."
    );
  }

  if (openIssues >= 20) {
    recommendations.push(
      "Prioritize the issue backlog and focus on high-impact items."
    );
  }

  if (openPullRequests >= 10) {
    recommendations.push(
      "Reduce the pull-request backlog to improve delivery flow."
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "Continue monitoring repository activity and maintenance trends."
    );
  }

  /* ================================================= */
  /* INSIGHT                                           */
  /* ================================================= */

  const insight =
    generateInsight(
      score,
      recentCommits,
      staleIssues,
      stalePullRequests,
      openIssues,
      openPullRequests
    );

  /* ================================================= */
  /* RESULT                                            */
  /* ================================================= */

  return {
    score,
    level,

    activityScore,
    maintenanceScore,
    collaborationScore,
    stabilityScore,

    recentCommits,
    openIssues,
    staleIssues,

    openPullRequests,
    stalePullRequests,

    mergedPullRequests,

    commitActivity,
    issueBacklog,
    pullRequestBacklog,

    risks,
    recommendations,

    insight,
  };
}