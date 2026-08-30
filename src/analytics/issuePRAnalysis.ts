import type {
  GitHubIssue,
  GitHubPullRequest,
} from "../services/githubApi";

/* ================================================= */
/* TYPES                                             */
/* ================================================= */

export type IssuePRRiskLevel =
  | "LOW"
  | "MODERATE"
  | "HIGH";

export type IssuePRSummary = {
  totalIssues: number;
  openIssues: number;
  closedIssues: number;

  totalPullRequests: number;
  openPullRequests: number;
  closedPullRequests: number;
  mergedPullRequests: number;

  issueResolutionRate: number;
  pullRequestMergeRate: number;

  averageIssueComments: number;
  averagePullRequestComments: number;

  staleIssues: number;
  stalePullRequests: number;

  riskLevel: IssuePRRiskLevel;
  riskScore: number;

  insight: string;
};

/* ================================================= */
/* CONSTANTS                                         */
/* ================================================= */

const STALE_DAYS = 30;

/* ================================================= */
/* DATE HELPERS                                      */
/* ================================================= */

function getDaysSince(date: string): number {
  const timestamp = new Date(date).getTime();

  if (Number.isNaN(timestamp)) {
    return 0;
  }

  const now = Date.now();

  const difference = now - timestamp;

  return Math.floor(
    difference /
      (1000 * 60 * 60 * 24)
  );
}

/* ================================================= */
/* STALE ITEMS                                       */
/* ================================================= */

function isStale(
  updatedAt: string
): boolean {
  return (
    getDaysSince(updatedAt) >=
    STALE_DAYS
  );
}

/* ================================================= */
/* RISK LEVEL                                        */
/* ================================================= */

function getRiskLevel(
  riskScore: number
): IssuePRRiskLevel {
  if (riskScore < 30) {
    return "LOW";
  }

  if (riskScore < 60) {
    return "MODERATE";
  }

  return "HIGH";
}

/* ================================================= */
/* INSIGHT                                           */
/* ================================================= */

function generateInsight(
  openIssues: number,
  staleIssues: number,
  openPullRequests: number,
  stalePullRequests: number,
  issueResolutionRate: number,
  pullRequestMergeRate: number
): string {
  if (
    staleIssues > 0 &&
    staleIssues >= openIssues / 2
  ) {
    return "A significant portion of open issues appears stale and may require maintenance attention.";
  }

  if (
    stalePullRequests > 0 &&
    stalePullRequests >=
      openPullRequests / 2
  ) {
    return "Several open pull requests appear stale and may need review or closure.";
  }

  if (
    issueResolutionRate < 50 &&
    openIssues > 0
  ) {
    return "Issue resolution is relatively low compared with the current issue backlog.";
  }

  if (
    pullRequestMergeRate < 50 &&
    openPullRequests > 0
  ) {
    return "Pull request throughput is relatively low and may indicate review bottlenecks.";
  }

  if (
    openIssues === 0 &&
    openPullRequests === 0
  ) {
    return "The repository currently has no open issue or pull request backlog.";
  }

  return "Issue and pull request activity appears reasonably healthy.";
}

/* ================================================= */
/* MAIN ANALYSIS                                     */
/* ================================================= */

export function analyzeIssuePR(
  issues: GitHubIssue[],
  pullRequests: GitHubPullRequest[]
): IssuePRSummary {
  /*
   * GitHub's Issues API also returns
   * pull requests. Remove them from the
   * issue collection so they are not
   * counted twice.
   */
  const realIssues =
    issues.filter(
      (issue) =>
        !issue.pull_request
    );

  /* ================================================= */
  /* ISSUE METRICS                                     */
  /* ================================================= */

  const openIssues =
    realIssues.filter(
      (issue) =>
        issue.state === "open"
    ).length;

  const closedIssues =
    realIssues.filter(
      (issue) =>
        issue.state === "closed"
    ).length;

  const totalIssues =
    realIssues.length;

  const issueResolutionRate =
    totalIssues > 0
      ? Math.round(
          (closedIssues /
            totalIssues) *
            100
        )
      : 0;

  const staleIssues =
    realIssues.filter(
      (issue) =>
        issue.state === "open" &&
        isStale(issue.updated_at)
    ).length;

  /*
   * GitHub normally provides comments,
   * but use a safe fallback in case the
   * field is missing from an API response.
   */
  const totalIssueComments =
    realIssues.reduce(
      (total, issue) =>
        total +
        (typeof issue.comments ===
        "number"
          ? issue.comments
          : 0),
      0
    );

  const averageIssueComments =
    totalIssues > 0
      ? Math.round(
          (totalIssueComments /
            totalIssues) *
            10
        ) / 10
      : 0;

  /* ================================================= */
  /* PULL REQUEST METRICS                              */
  /* ================================================= */

  const openPullRequests =
    pullRequests.filter(
      (pullRequest) =>
        pullRequest.state === "open"
    ).length;

  const closedPullRequests =
    pullRequests.filter(
      (pullRequest) =>
        pullRequest.state === "closed"
    ).length;

  const mergedPullRequests =
    pullRequests.filter(
      (pullRequest) =>
        pullRequest.merged_at !==
        null
    ).length;

  const totalPullRequests =
    pullRequests.length;

  const pullRequestMergeRate =
    totalPullRequests > 0
      ? Math.round(
          (mergedPullRequests /
            totalPullRequests) *
            100
        )
      : 0;

  const stalePullRequests =
    pullRequests.filter(
      (pullRequest) =>
        pullRequest.state === "open" &&
        isStale(
          pullRequest.updated_at
        )
    ).length;

  /*
   * Some repository/API responses may
   * not include the comments field.
   *
   * Treat missing comments as 0 instead
   * of allowing undefined to produce NaN.
   */
  const totalPullRequestComments =
    pullRequests.reduce(
      (total, pullRequest) =>
        total +
        (typeof pullRequest.comments ===
        "number"
          ? pullRequest.comments
          : 0),
      0
    );

  const averagePullRequestComments =
    totalPullRequests > 0
      ? Math.round(
          (totalPullRequestComments /
            totalPullRequests) *
            10
        ) / 10
      : 0;

  /* ================================================= */
  /* RISK SCORE                                        */
  /* ================================================= */

  let riskScore = 0;

  /*
   * Open issue backlog.
   */
  if (openIssues >= 50) {
    riskScore += 30;
  } else if (openIssues >= 20) {
    riskScore += 20;
  } else if (openIssues >= 10) {
    riskScore += 10;
  }

  /*
   * Stale issues.
   */
  if (staleIssues > 0) {
    const staleIssueRatio =
      openIssues > 0
        ? staleIssues /
          openIssues
        : 0;

    if (staleIssueRatio >= 0.5) {
      riskScore += 25;
    } else if (
      staleIssueRatio >= 0.25
    ) {
      riskScore += 15;
    } else {
      riskScore += 5;
    }
  }

  /*
   * Open PR backlog.
   */
  if (openPullRequests >= 20) {
    riskScore += 25;
  } else if (
    openPullRequests >= 10
  ) {
    riskScore += 15;
  } else if (
    openPullRequests >= 5
  ) {
    riskScore += 10;
  }

  /*
   * Stale PRs.
   */
  if (stalePullRequests > 0) {
    const stalePRRatio =
      openPullRequests > 0
        ? stalePullRequests /
          openPullRequests
        : 0;

    if (stalePRRatio >= 0.5) {
      riskScore += 20;
    } else if (
      stalePRRatio >= 0.25
    ) {
      riskScore += 10;
    } else {
      riskScore += 5;
    }
  }

  riskScore = Math.min(
    100,
    riskScore
  );

  const riskLevel =
    getRiskLevel(riskScore);

  /* ================================================= */
  /* INSIGHT                                           */
  /* ================================================= */

  const insight =
    generateInsight(
      openIssues,
      staleIssues,
      openPullRequests,
      stalePullRequests,
      issueResolutionRate,
      pullRequestMergeRate
    );

  /* ================================================= */
  /* RESULT                                            */
  /* ================================================= */

  return {
    totalIssues,
    openIssues,
    closedIssues,

    totalPullRequests,
    openPullRequests,
    closedPullRequests,
    mergedPullRequests,

    issueResolutionRate,
    pullRequestMergeRate,

    averageIssueComments,
    averagePullRequestComments,

    staleIssues,
    stalePullRequests,

    riskLevel,
    riskScore,

    insight,
  };
}