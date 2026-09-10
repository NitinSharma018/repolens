import type {
  GitHubCommit,
  GitHubPullRequest,
} from "../services/githubApi";

/* ================================================= */
/* TYPES                                             */
/* ================================================= */

export type DevelopmentTrendDirection =
  | "IMPROVING"
  | "STABLE"
  | "DECLINING";

export type DevelopmentActivityLevel =
  | "HIGH"
  | "MODERATE"
  | "LOW";

export type DevelopmentTrendSummary = {
  trend: DevelopmentTrendDirection;
  activityLevel: DevelopmentActivityLevel;

  trendScore: number;

  recentCommits: number;
  previousCommits: number;

  recentPullRequests: number;
  previousPullRequests: number;

  recentMergedPullRequests: number;
  previousMergedPullRequests: number;

  commitChange: number;
  pullRequestChange: number;
  mergeChange: number;

  activeDays: number;
  recentCommitFrequency: number;

  insight: string;
};

/* ================================================= */
/* CONSTANTS                                         */
/* ================================================= */

const PERIOD_DAYS = 30;

/* ================================================= */
/* DATE HELPERS                                      */
/* ================================================= */

function getDate(
  commit: GitHubCommit
): string | null {
  return (
    commit.commit?.author?.date ??
    commit.commit?.committer?.date ??
    null
  );
}

function getDaysSince(
  date: string
): number {
  const timestamp =
    new Date(date).getTime();

  if (Number.isNaN(timestamp)) {
    return Infinity;
  }

  return Math.floor(
    (Date.now() - timestamp) /
      (1000 * 60 * 60 * 24)
  );
}

function isWithinDays(
  date: string,
  days: number
): boolean {
  return (
    getDaysSince(date) <= days
  );
}

function getChangePercentage(
  current: number,
  previous: number
): number {
  if (previous === 0) {
    if (current === 0) {
      return 0;
    }

    return 100;
  }

  return Math.round(
    ((current - previous) /
      previous) *
      100
  );
}

/* ================================================= */
/* ACTIVITY LEVEL                                    */
/* ================================================= */

function getActivityLevel(
  recentCommits: number
): DevelopmentActivityLevel {
  if (recentCommits >= 20) {
    return "HIGH";
  }

  if (recentCommits >= 5) {
    return "MODERATE";
  }

  return "LOW";
}

/* ================================================= */
/* TREND DIRECTION                                   */
/* ================================================= */

function getTrendDirection(
  score: number
): DevelopmentTrendDirection {
  if (score >= 60) {
    return "IMPROVING";
  }

  if (score <= 40) {
    return "DECLINING";
  }

  return "STABLE";
}

/* ================================================= */
/* INSIGHT                                           */
/* ================================================= */

function generateInsight(
  trend: DevelopmentTrendDirection,
  activityLevel: DevelopmentActivityLevel,
  pullRequestChange: number,
  mergeChange: number,
  activeDays: number
): string {
  if (
    trend === "IMPROVING"
  ) {
    return "Development activity is trending upward, indicating increasing repository momentum.";
  }

  if (
    trend === "DECLINING"
  ) {
    return "Development activity has slowed compared with the previous period and may require attention.";
  }

  if (
    activityLevel === "LOW"
  ) {
    return "Recent development activity is relatively low, with limited commit activity during the current period.";
  }

  if (
    mergeChange > 0 &&
    pullRequestChange > 0
  ) {
    return "Development activity is relatively stable while pull request throughput shows positive movement.";
  }

  if (activeDays >= 15) {
    return "The repository shows consistent development activity across multiple days.";
  }

  return "Development activity appears relatively stable compared with the previous period.";
}

/* ================================================= */
/* MAIN ANALYSIS                                     */
/* ================================================= */

export function analyzeDevelopmentTrend(
  commits: GitHubCommit[],
  pullRequests: GitHubPullRequest[]
): DevelopmentTrendSummary {
  /*
   * Current period:
   * last 30 days.
   */

  const recentCommits =
    commits.filter((commit) => {
      const date = getDate(commit);

      return (
        date !== null &&
        isWithinDays(
          date,
          PERIOD_DAYS
        )
      );
    });

  /*
   * Previous period:
   * 31–60 days ago.
   */

  const previousCommits =
    commits.filter((commit) => {
      const date = getDate(commit);

      if (!date) {
        return false;
      }

      const days =
        getDaysSince(date);

      return (
        days > PERIOD_DAYS &&
        days <= PERIOD_DAYS * 2
      );
    });

  /* ================================================= */
  /* PULL REQUEST PERIODS                              */
  /* ================================================= */

  const recentPullRequests =
    pullRequests.filter(
      (pullRequest) =>
        isWithinDays(
          pullRequest.created_at,
          PERIOD_DAYS
        )
    );

  const previousPullRequests =
    pullRequests.filter(
      (pullRequest) => {
        const days =
          getDaysSince(
            pullRequest.created_at
          );

        return (
          days > PERIOD_DAYS &&
          days <= PERIOD_DAYS * 2
        );
      }
    );

  /* ================================================= */
  /* MERGED PR PERIODS                                 */
  /* ================================================= */

  const recentMergedPullRequests =
    pullRequests.filter(
      (pullRequest) =>
        pullRequest.merged_at !== null &&
        isWithinDays(
          pullRequest.merged_at,
          PERIOD_DAYS
        )
    );

  const previousMergedPullRequests =
    pullRequests.filter(
      (pullRequest) => {
        if (
          pullRequest.merged_at ===
          null
        ) {
          return false;
        }

        const days =
          getDaysSince(
            pullRequest.merged_at
          );

        return (
          days > PERIOD_DAYS &&
          days <= PERIOD_DAYS * 2
        );
      }
    );

  /* ================================================= */
  /* COUNTS                                            */
  /* ================================================= */

  const recentCommitCount =
    recentCommits.length;

  const previousCommitCount =
    previousCommits.length;

  const recentPullRequestCount =
    recentPullRequests.length;

  const previousPullRequestCount =
    previousPullRequests.length;

  const recentMergedCount =
    recentMergedPullRequests.length;

  const previousMergedCount =
    previousMergedPullRequests.length;

  /* ================================================= */
  /* CHANGES                                           */
  /* ================================================= */

  const commitChange =
    getChangePercentage(
      recentCommitCount,
      previousCommitCount
    );

  const pullRequestChange =
    getChangePercentage(
      recentPullRequestCount,
      previousPullRequestCount
    );

  const mergeChange =
    getChangePercentage(
      recentMergedCount,
      previousMergedCount
    );

  /* ================================================= */
  /* ACTIVE DAYS                                       */
  /* ================================================= */

  const activeDaySet =
    new Set<string>();

  for (const commit of recentCommits) {
    const date = getDate(commit);

    if (!date) {
      continue;
    }

    const day =
      new Date(date)
        .toISOString()
        .slice(0, 10);

    activeDaySet.add(day);
  }

  const activeDays =
    activeDaySet.size;

  /* ================================================= */
  /* COMMIT FREQUENCY                                  */
  /* ================================================= */

  const recentCommitFrequency =
    Math.round(
      (recentCommitCount /
        PERIOD_DAYS) *
        10
    ) / 10;

  /* ================================================= */
  /* TREND SCORE                                       */
  /* ================================================= */

  /*
   * Compare the three main development
   * signals:
   *
   * commits       50%
   * pull requests 25%
   * merges        25%
   */

  const normalizedCommitChange =
    Math.max(
      -100,
      Math.min(
        100,
        commitChange
      )
    );

  const normalizedPRChange =
    Math.max(
      -100,
      Math.min(
        100,
        pullRequestChange
      )
    );

  const normalizedMergeChange =
    Math.max(
      -100,
      Math.min(
        100,
        mergeChange
      )
    );

  const weightedChange =
    normalizedCommitChange * 0.5 +
    normalizedPRChange * 0.25 +
    normalizedMergeChange * 0.25;

  let trendScore = Math.round(
    50 +
      weightedChange / 2
  );

  /*
   * Consistent activity across many
   * days is a positive signal.
   */

  if (activeDays >= 20) {
    trendScore += 5;
  } else if (
    activeDays >= 10
  ) {
    trendScore += 2;
  }

  trendScore = Math.max(
    0,
    Math.min(
      100,
      trendScore
    )
  );

  const trend =
    getTrendDirection(
      trendScore
    );

  const activityLevel =
    getActivityLevel(
      recentCommitCount
    );

  /* ================================================= */
  /* INSIGHT                                           */
  /* ================================================= */

  const insight =
  generateInsight(
    trend,
    activityLevel,
    pullRequestChange,
    mergeChange,
    activeDays
  );

  /* ================================================= */
  /* RESULT                                            */
  /* ================================================= */

  return {
    trend,
    activityLevel,

    trendScore,

    recentCommits:
      recentCommitCount,

    previousCommits:
      previousCommitCount,

    recentPullRequests:
      recentPullRequestCount,

    previousPullRequests:
      previousPullRequestCount,

    recentMergedPullRequests:
      recentMergedCount,

    previousMergedPullRequests:
      previousMergedCount,

    commitChange,
    pullRequestChange,
    mergeChange,

    activeDays,
    recentCommitFrequency,

    insight,
  };
}