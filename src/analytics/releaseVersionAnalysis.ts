
export type ReleaseMaturity =
  | "MATURE"
  | "ACTIVE"
  | "LIMITED"
  | "NO RELEASES";

export type ReleaseTrend =
  | "ACTIVE"
  | "STABLE"
  | "INACTIVE";

export type ReleaseVersionSummary = {
  maturity: ReleaseMaturity;
  trend: ReleaseTrend;

  releaseCount: number;
  recentReleaseCount: number;

  latestReleaseName: string | null;
  latestReleaseDate: string | null;

  daysSinceLatestRelease: number | null;

  versioningScore: number;

  hasReleases: boolean;
  hasTags: boolean;

  insight: string;
};

type GitHubReleaseLike = {
  name?: string | null;
  tag_name: string;
  published_at?: string | null;
  created_at: string;
  draft: boolean;
  prerelease: boolean;
};

/* ================================================= */
/* DATE HELPERS                                      */
/* ================================================= */

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

/* ================================================= */
/* VERSIONING CHECK                                  */
/* ================================================= */

function looksLikeVersionTag(
  tag: string
): boolean {
  return /^v?\d+\.\d+\.\d+/.test(
    tag.trim()
  );
}

/* ================================================= */
/* MATURITY                                         */
/* ================================================= */

function getMaturity(
  releaseCount: number,
  recentReleaseCount: number,
  hasReleases: boolean
): ReleaseMaturity {
  if (!hasReleases) {
    return "NO RELEASES";
  }

  if (
    releaseCount >= 10 &&
    recentReleaseCount >= 2
  ) {
    return "MATURE";
  }

  if (
    releaseCount >= 3 ||
    recentReleaseCount >= 1
  ) {
    return "ACTIVE";
  }

  return "LIMITED";
}

/* ================================================= */
/* RELEASE TREND                                    */
/* ================================================= */

function getTrend(
  recentReleaseCount: number,
  latestReleaseDays: number | null
): ReleaseTrend {
  if (
    recentReleaseCount > 0
  ) {
    return "ACTIVE";
  }

  if (
    latestReleaseDays !== null &&
    latestReleaseDays <= 180
  ) {
    return "STABLE";
  }

  return "INACTIVE";
}

/* ================================================= */
/* SCORE                                            */
/* ================================================= */

function calculateVersioningScore(
  releaseCount: number,
  recentReleaseCount: number,
  versionedReleaseCount: number,
  latestReleaseDays: number | null
): number {
  let score = 0;

  /*
   * Release history
   */
  if (releaseCount >= 20) {
    score += 35;
  } else if (releaseCount >= 10) {
    score += 30;
  } else if (releaseCount >= 5) {
    score += 22;
  } else if (releaseCount >= 1) {
    score += 12;
  }

  /*
   * Recent release activity
   */
  if (recentReleaseCount >= 4) {
    score += 30;
  } else if (recentReleaseCount >= 2) {
    score += 25;
  } else if (recentReleaseCount >= 1) {
    score += 15;
  }

  /*
   * Semantic versioning consistency
   */
  if (releaseCount > 0) {
    const versionRatio =
      versionedReleaseCount /
      releaseCount;

    if (versionRatio >= 0.9) {
      score += 25;
    } else if (versionRatio >= 0.6) {
      score += 18;
    } else if (versionRatio > 0) {
      score += 10;
    }
  }

  /*
   * Recency
   */
  if (
    latestReleaseDays !== null
  ) {
    if (latestReleaseDays <= 30) {
      score += 10;
    } else if (
      latestReleaseDays <= 90
    ) {
      score += 7;
    } else if (
      latestReleaseDays <= 180
    ) {
      score += 4;
    }
  }

  return Math.max(
    0,
    Math.min(100, score)
  );
}

/* ================================================= */
/* INSIGHT                                          */
/* ================================================= */

function generateInsight(
  maturity: ReleaseMaturity,
  trend: ReleaseTrend,
  releaseCount: number,
  recentReleaseCount: number,
  latestReleaseDays: number | null
): string {
  if (
    maturity === "NO RELEASES"
  ) {
    return "The repository has no published releases, so versioned delivery practices cannot be evaluated.";
  }

  if (
    maturity === "MATURE" &&
    trend === "ACTIVE"
  ) {
    return "The repository demonstrates a mature release workflow with strong release history and recent version activity.";
  }

  if (
    recentReleaseCount > 0
  ) {
    return "The repository is actively shipping releases, indicating an established versioning and delivery workflow.";
  }

  if (
    latestReleaseDays !== null &&
    latestReleaseDays > 180
  ) {
    return "Release activity appears inactive, with the latest release being more than six months old.";
  }

  if (releaseCount < 3) {
    return "The repository has limited release history, so its versioning discipline is still difficult to assess.";
  }

  return "The repository has an established release history, although recent release activity is relatively limited.";
}

/* ================================================= */
/* MAIN ANALYSIS                                    */
/* ================================================= */

export function analyzeReleaseVersion(
  releases: GitHubReleaseLike[]
): ReleaseVersionSummary {
  const publishedReleases =
    releases.filter(
      (release) =>
        !release.draft
    );

  const releaseCount =
    publishedReleases.length;

  const recentReleaseCount =
    publishedReleases.filter(
      (release) => {
        const date =
          release.published_at ??
          release.created_at;

        return (
          getDaysSince(date) <= 180
        );
      }
    ).length;

  const sortedReleases =
    [...publishedReleases].sort(
      (a, b) => {
        const dateA = new Date(
          a.published_at ??
            a.created_at
        ).getTime();

        const dateB = new Date(
          b.published_at ??
            b.created_at
        ).getTime();

        return dateB - dateA;
      }
    );

  const latestRelease =
    sortedReleases[0] ?? null;

  const latestReleaseDate =
    latestRelease
      ? latestRelease.published_at ??
        latestRelease.created_at
      : null;

  const daysSinceLatestRelease =
    latestReleaseDate
      ? getDaysSince(
          latestReleaseDate
        )
      : null;

  const versionedReleaseCount =
    publishedReleases.filter(
      (release) =>
        looksLikeVersionTag(
          release.tag_name
        )
    ).length;

  const hasReleases =
    releaseCount > 0;

  /*
   * GitHub repositories normally expose
   * tags through the repository tags
   * endpoint. For this first version,
   * release tags themselves provide a
   * reliable versioning signal.
   */
  const hasTags =
  versionedReleaseCount > 0;

  const maturity =
    getMaturity(
      releaseCount,
      recentReleaseCount,
      hasReleases
    );

  const trend =
    getTrend(
      recentReleaseCount,
      daysSinceLatestRelease
    );

  const versioningScore =
    calculateVersioningScore(
      releaseCount,
      recentReleaseCount,
      versionedReleaseCount,
      daysSinceLatestRelease
    );

  const insight =
    generateInsight(
      maturity,
      trend,
      releaseCount,
      recentReleaseCount,
      daysSinceLatestRelease
    );

  return {
    maturity,
    trend,

    releaseCount,
    recentReleaseCount,

    latestReleaseName:
      latestRelease?.name ??
      latestRelease?.tag_name ??
      null,

    latestReleaseDate,

    daysSinceLatestRelease,

    versioningScore,

    hasReleases,
    hasTags,

    insight,
  };
}