import type {
  GitHubContributor,
  GitHubContributorWeek,
} from "../services/githubApi";

/* ================================================= */
/* TYPES                                             */
/* ================================================= */

export type ContributorRiskLevel =
  | "LOW"
  | "MODERATE"
  | "HIGH";

export type ContributorItem = {
  login: string;
  avatarUrl: string;
  commits: number;
  percentage: number;
};

export type ContributorSummary = {
  totalContributors: number;
  activeContributors: number;

  totalRecentCommits: number;

  topContributor: ContributorItem | null;

  topContributors: ContributorItem[];

  concentrationPercentage: number;

  riskLevel: ContributorRiskLevel;

  riskScore: number;
};

/* ================================================= */
/* CONSTANTS                                         */
/* ================================================= */

const ANALYSIS_WEEKS = 12;

const TOP_CONTRIBUTORS_LIMIT = 5;

/* ================================================= */
/* HELPER: RECENT WEEKS                              */
/* ================================================= */

function getRecentWeeks(
  weeks: GitHubContributorWeek[]
): GitHubContributorWeek[] {
  if (!weeks.length) {
    return [];
  }

  return weeks.slice(-ANALYSIS_WEEKS);
}

/* ================================================= */
/* HELPER: RECENT COMMITS                            */
/* ================================================= */

function getRecentCommits(
  contributor: GitHubContributor
): number {
  const recentWeeks = getRecentWeeks(
    contributor.weeks
  );

  return recentWeeks.reduce(
    (total, week) => total + week.c,
    0
  );
}

/* ================================================= */
/* RISK LEVEL                                        */
/* ================================================= */

function getRiskLevel(
  concentrationPercentage: number
): ContributorRiskLevel {
  if (concentrationPercentage < 30) {
    return "LOW";
  }

  if (concentrationPercentage < 60) {
    return "MODERATE";
  }

  return "HIGH";
}

/* ================================================= */
/* RISK SCORE                                        */
/* ================================================= */

function getRiskScore(
  concentrationPercentage: number
): number {
  return Math.min(
    100,
    Math.round(concentrationPercentage)
  );
}

/* ================================================= */
/* MAIN ANALYSIS                                     */
/* ================================================= */

export function analyzeContributors(
  contributors: GitHubContributor[]
): ContributorSummary {
  /*
   * Remove contributors without
   * a valid GitHub profile.
   */
  const validContributors =
    contributors.filter(
      (contributor) =>
        contributor.author !== null
    );

  /*
   * Calculate recent activity
   * for every contributor.
   */
  const contributorActivity =
    validContributors
      .map((contributor) => ({
        contributor,
        recentCommits:
          getRecentCommits(contributor),
      }))
      .filter(
        (item) =>
          item.recentCommits > 0
      )
      .sort(
        (a, b) =>
          b.recentCommits -
          a.recentCommits
      );

  /*
   * Total commits during the
   * recent analysis period.
   */
  const totalRecentCommits =
    contributorActivity.reduce(
      (total, item) =>
        total +
        item.recentCommits,
      0
    );

  /*
   * Number of contributors who
   * actually contributed recently.
   */
  const activeContributors =
    contributorActivity.length;

  /*
   * Convert contributor activity
   * into UI-friendly data.
   */
  const contributorItems =
    contributorActivity.map(
      (item) => {
        const author =
          item.contributor.author;

        if (!author) {
          return null;
        }

        const percentage =
          totalRecentCommits > 0
            ? Math.round(
                (item.recentCommits /
                  totalRecentCommits) *
                  100
              )
            : 0;

        return {
          login: author.login,
          avatarUrl:
            author.avatar_url,
          commits:
            item.recentCommits,
          percentage,
        };
      }
    ).filter(
      (
        item
      ): item is ContributorItem =>
        item !== null
    );

  /*
   * Top contributor.
   */
  const topContributor =
    contributorItems[0] ?? null;

  /*
   * Top contributor concentration.
   */
  const concentrationPercentage =
    topContributor?.percentage ?? 0;

  /*
   * Top five contributors.
   */
  const topContributors =
    contributorItems.slice(
      0,
      TOP_CONTRIBUTORS_LIMIT
    );

  /*
   * Risk analysis.
   */
  const riskLevel =
    getRiskLevel(
      concentrationPercentage
    );

  const riskScore =
    getRiskScore(
      concentrationPercentage
    );

  return {
    totalContributors:
      validContributors.length,

    activeContributors,

    totalRecentCommits,

    topContributor,

    topContributors,

    concentrationPercentage,

    riskLevel,

    riskScore,
  };
}