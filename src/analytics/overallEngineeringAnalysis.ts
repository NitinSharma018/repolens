import type { ContributorSummary } from "./contributorAnalysis";
import type { IssuePRSummary } from "./issuePRAnalysis";
import type { CodebaseAnalysis } from "./codebaseAnalysis";
import type { RepositoryHealthSummary } from "./repositoryHealthAnalysis";
import type { DevelopmentTrendSummary } from "./developmentTrendAnalysis";
import type { ReleaseVersionSummary } from "./releaseVersionAnalysis";

export type EngineeringVerdict =
  | "EXCELLENT"
  | "HEALTHY"
  | "NEEDS ATTENTION"
  | "AT RISK";

export type OverallEngineeringSummary = {
  overallScore: number;
  verdict: EngineeringVerdict;

  strengths: string[];
  risks: string[];
  improvementAreas: string[];
  recommendations: string[];

  insight: string;
};

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function contributorScore(
  contributor: ContributorSummary
): number {
  return clampScore(100 - contributor.riskScore);
}

function issuePRScore(
  issuePR: IssuePRSummary
): number {
  return clampScore(100 - issuePR.riskScore);
}

function developmentScore(
  development: DevelopmentTrendSummary
): number {
  return clampScore(development.trendScore);
}

function releaseScore(
  release: ReleaseVersionSummary
): number {
  return clampScore(release.versioningScore);
}

function getVerdict(
  score: number
): EngineeringVerdict {
  if (score >= 80) {
    return "EXCELLENT";
  }

  if (score >= 65) {
    return "HEALTHY";
  }

  if (score >= 45) {
    return "NEEDS ATTENTION";
  }

  return "AT RISK";
}

function addUnique(
  list: string[],
  value: string
): void {
  if (!list.includes(value)) {
    list.push(value);
  }
}

function generateStrengths(
  contributor: ContributorSummary,
  issuePR: IssuePRSummary,
  codebase: CodebaseAnalysis,
  repository: RepositoryHealthSummary,
  development: DevelopmentTrendSummary,
  release: ReleaseVersionSummary
): string[] {
  const strengths: string[] = [];

  if (repository.score >= 75) {
    addUnique(
      strengths,
      "Strong overall repository health"
    );
  }

  if (codebase.healthScore >= 75) {
    addUnique(
      strengths,
      "Healthy and well-structured codebase"
    );
  }

  if (codebase.testRatio >= 20) {
    addUnique(
      strengths,
      "Good test coverage relative to the codebase"
    );
  }

  if (
    development.trend === "IMPROVING" &&
    development.activityLevel === "HIGH"
  ) {
    addUnique(
      strengths,
      "Strong and improving development momentum"
    );
  } else if (
    development.activityLevel === "HIGH"
  ) {
    addUnique(
      strengths,
      "High development activity"
    );
  }

  if (
    contributor.riskLevel === "LOW" &&
    contributor.totalContributors > 1
  ) {
    addUnique(
      strengths,
      "Healthy contributor distribution"
    );
  }

  if (
    issuePR.riskLevel === "LOW" &&
    issuePR.issueResolutionRate >= 70
  ) {
    addUnique(
      strengths,
      "Effective issue and pull request management"
    );
  }

  if (
    release.maturity === "MATURE" &&
    release.trend === "ACTIVE"
  ) {
    addUnique(
      strengths,
      "Mature and active release workflow"
    );
  } else if (
    release.versioningScore >= 75
  ) {
    addUnique(
      strengths,
      "Strong release and versioning practices"
    );
  }

  return strengths;
}

function generateRisks(
  contributor: ContributorSummary,
  issuePR: IssuePRSummary,
  codebase: CodebaseAnalysis,
  repository: RepositoryHealthSummary,
  development: DevelopmentTrendSummary,
  release: ReleaseVersionSummary
): string[] {
  const risks: string[] = [];

  if (contributor.riskLevel === "HIGH") {
    addUnique(
      risks,
      "High contributor concentration"
    );
  }

  if (issuePR.riskLevel === "HIGH") {
    addUnique(
      risks,
      "High issue and pull request backlog"
    );
  }

  if (issuePR.staleIssues > 0) {
    addUnique(
      risks,
      `${issuePR.staleIssues} stale issue(s) require attention`
    );
  }

  if (issuePR.stalePullRequests > 0) {
    addUnique(
      risks,
      `${issuePR.stalePullRequests} stale pull request(s) require attention`
    );
  }

  if (codebase.healthLevel === "LOW") {
  addUnique(
    risks,
    "Codebase structure requires attention"
  );
}

  if (codebase.testRatio < 10) {
    addUnique(
      risks,
      "Low test coverage"
    );
  }

  if (development.trend === "DECLINING") {
    addUnique(
      risks,
      "Development activity is declining"
    );
  }

  if (development.activityLevel === "LOW") {
    addUnique(
      risks,
      "Low recent development activity"
    );
  }

  if (release.trend === "INACTIVE") {
    addUnique(
      risks,
      "Release activity appears inactive"
    );
  }

  if (repository.level === "AT RISK") {
    addUnique(
      risks,
      "Overall repository health is at risk"
    );
  }

  return risks;
}

function generateImprovementAreas(
  contributor: ContributorSummary,
  issuePR: IssuePRSummary,
  codebase: CodebaseAnalysis,
  development: DevelopmentTrendSummary,
  release: ReleaseVersionSummary
): string[] {
  const areas: string[] = [];

  if (contributor.riskLevel !== "LOW") {
    addUnique(
      areas,
      "Improve contributor diversity"
    );
  }

  if (
    issuePR.openIssues > 0 ||
    issuePR.staleIssues > 0
  ) {
    addUnique(
      areas,
      "Improve issue backlog management"
    );
  }

  if (
    issuePR.openPullRequests > 0 ||
    issuePR.stalePullRequests > 0
  ) {
    addUnique(
      areas,
      "Improve pull request turnaround"
    );
  }

  if (codebase.testRatio < 20) {
    addUnique(
      areas,
      "Increase automated test coverage"
    );
  }

  if (development.trend !== "IMPROVING") {
    addUnique(
      areas,
      "Improve development momentum"
    );
  }

  if (
    !release.hasReleases ||
    release.versioningScore < 60
  ) {
    addUnique(
      areas,
      "Strengthen release and versioning practices"
    );
  }

  return areas;
}

function generateRecommendations(
  contributor: ContributorSummary,
  issuePR: IssuePRSummary,
  codebase: CodebaseAnalysis,
  development: DevelopmentTrendSummary,
  release: ReleaseVersionSummary
): string[] {
  const recommendations: string[] = [];

  if (contributor.riskLevel !== "LOW") {
    addUnique(
      recommendations,
      "Encourage more contributors to reduce dependency on a small number of developers."
    );
  }

  if (
    issuePR.staleIssues > 0 ||
    issuePR.stalePullRequests > 0
  ) {
    addUnique(
      recommendations,
      "Prioritize stale issues and pull requests during regular maintenance cycles."
    );
  }

  if (codebase.testRatio < 20) {
    addUnique(
      recommendations,
      "Add automated tests for important application logic and critical workflows."
    );
  }

  if (development.trend === "DECLINING") {
    addUnique(
      recommendations,
      "Investigate the decline in development activity and establish a consistent contribution cadence."
    );
  }

  if (release.trend === "INACTIVE") {
    addUnique(
      recommendations,
      "Maintain a more consistent release cadence when meaningful changes are ready."
    );
  }

  if (
    release.hasReleases &&
    release.versioningScore >= 75
  ) {
    addUnique(
      recommendations,
      "Continue the existing release and semantic versioning practices."
    );
  }

  if (recommendations.length === 0) {
    addUnique(
      recommendations,
      "Continue monitoring engineering signals and maintain the current development practices."
    );
  }

  return recommendations;
}

function generateInsight(
  verdict: EngineeringVerdict,
  strengths: string[],
  risks: string[]
): string {
  if (verdict === "EXCELLENT") {
    return `The repository demonstrates excellent overall engineering health with ${strengths.length} strong engineering signal(s) and limited areas of concern.`;
  }

  if (verdict === "HEALTHY") {
    if (risks.length > 0) {
      return `The repository is generally healthy, although ${risks.length} engineering risk(s) should be monitored to maintain long-term quality.`;
    }

    return "The repository demonstrates healthy engineering practices across its analyzed dimensions.";
  }

  if (verdict === "NEEDS ATTENTION") {
    return `The repository shows several positive engineering signals, but ${risks.length} area(s) require attention to improve overall engineering health.`;
  }

  return "The repository currently shows significant engineering risks that should be addressed to improve maintainability, collaboration, and delivery reliability.";
}

export function analyzeOverallEngineering(
  contributor: ContributorSummary,
  issuePR: IssuePRSummary,
  codebase: CodebaseAnalysis,
  repository: RepositoryHealthSummary,
  development: DevelopmentTrendSummary,
  release: ReleaseVersionSummary
): OverallEngineeringSummary {
  const contributorHealth =
    contributorScore(contributor);

  const issuePRHealth =
    issuePRScore(issuePR);

  const codebaseHealth =
    codebase.healthScore;

  const repositoryHealth =
    repository.score;

  const developmentHealth =
    developmentScore(development);

  const releaseHealth =
    releaseScore(release);

  const overallScore = clampScore(
    repositoryHealth * 0.25 +
      codebaseHealth * 0.20 +
      developmentHealth * 0.15 +
      issuePRHealth * 0.15 +
      contributorHealth * 0.10 +
      releaseHealth * 0.15
  );

  const verdict =
    getVerdict(overallScore);

  const strengths =
    generateStrengths(
      contributor,
      issuePR,
      codebase,
      repository,
      development,
      release
    );

  const risks =
    generateRisks(
      contributor,
      issuePR,
      codebase,
      repository,
      development,
      release
    );

  const improvementAreas =
    generateImprovementAreas(
      contributor,
      issuePR,
      codebase,
      development,
      release
    );

  const recommendations =
    generateRecommendations(
      contributor,
      issuePR,
      codebase,
      development,
      release
    );

  const insight =
    generateInsight(
      verdict,
      strengths,
      risks
    );

  return {
    overallScore,
    verdict,
    strengths,
    risks,
    improvementAreas,
    recommendations,
    insight,
  };
}