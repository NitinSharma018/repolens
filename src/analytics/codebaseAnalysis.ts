import type { GitHubContent } from "../services/githubApi";

/* ================================================= */
/* TYPES                                             */
/* ================================================= */

export type CodebaseHealthLevel =
  | "LOW"
  | "MODERATE"
  | "HIGH";

export type CodebaseAnalysis = {
  totalFiles: number;
  totalDirectories: number;

  sourceFiles: number;
  testFiles: number;
  configFiles: number;
  documentationFiles: number;

  totalCodeSize: number;

  languages: {
    language: string;
    files: number;
    percentage: number;
  }[];

  largestFiles: {
    name: string;
    path: string;
    size: number;
  }[];

  topDirectories: {
    name: string;
    files: number;
  }[];

  testRatio: number;

  healthScore: number;
  healthLevel: CodebaseHealthLevel;

  insight: string;
};

/* ================================================= */
/* CONSTANTS                                         */
/* ================================================= */

const SOURCE_EXTENSIONS = new Set([
  "js",
  "jsx",
  "ts",
  "tsx",
  "py",
  "java",
  "c",
  "cpp",
  "h",
  "hpp",
  "cs",
  "go",
  "rs",
  "php",
  "rb",
  "swift",
  "kt",
  "kts",
  "dart",
  "vue",
  "svelte",
]);

const CONFIG_EXTENSIONS = new Set([
  "json",
  "yaml",
  "yml",
  "toml",
  "ini",
  "xml",
  "env",
]);

const DOCUMENTATION_FILES = new Set([
  "readme.md",
  "readme",
  "contributing.md",
  "code_of_conduct.md",
  "security.md",
  "changelog.md",
]);

/* ================================================= */
/* HELPERS                                           */
/* ================================================= */

function getExtension(
  filename: string
): string {
  const parts = filename
    .toLowerCase()
    .split(".");

  if (parts.length < 2) {
    return "";
  }

  return parts[parts.length - 1];
}

function isTestFile(
  path: string
): boolean {
  const normalized =
    path.toLowerCase();

  return (
    normalized.includes("/test/") ||
    normalized.includes("/tests/") ||
    normalized.includes("__tests__/") ||
    normalized.includes(".test.") ||
    normalized.includes(".spec.") ||
    normalized.endsWith("_test.go") ||
    normalized.endsWith("_test.py")
  );
}

function isDocumentationFile(
  filename: string
): boolean {
  return DOCUMENTATION_FILES.has(
    filename.toLowerCase()
  );
}

function getDirectory(
  path: string
): string {
  const parts = path.split("/");

  if (parts.length <= 1) {
    return "Root";
  }

  return parts[0];
}

function getHealthLevel(
  score: number
): CodebaseHealthLevel {
  if (score >= 75) {
    return "HIGH";
  }

  if (score >= 50) {
    return "MODERATE";
  }

  return "LOW";
}

/* ================================================= */
/* INSIGHT                                           */
/* ================================================= */

function generateInsight(
  totalFiles: number,
  sourceFiles: number,
  testFiles: number,
  documentationFiles: number,
  testRatio: number,
  healthLevel: CodebaseHealthLevel
): string {
  if (totalFiles === 0) {
    return "No repository files were available for codebase analysis.";
  }

  if (
    sourceFiles > 0 &&
    testFiles === 0
  ) {
    return "The repository contains source code but no obvious test files were detected.";
  }

  if (
    sourceFiles > 0 &&
    testRatio < 10
  ) {
    return "The codebase is active but has relatively limited test-file coverage compared with its source files.";
  }

  if (
    documentationFiles === 0 &&
    sourceFiles > 0
  ) {
    return "The codebase contains source files but has limited documentation signals.";
  }

  if (healthLevel === "HIGH") {
    return "The repository shows a well-organized codebase with healthy testing and documentation signals.";
  }

  if (healthLevel === "MODERATE") {
    return "The repository has a reasonably structured codebase, although some maintainability signals could be improved.";
  }

  return "The codebase shows several maintainability signals that may require developer attention.";
}

/* ================================================= */
/* MAIN ANALYSIS                                     */
/* ================================================= */

export function analyzeCodebase(
  contents: GitHubContent[]
): CodebaseAnalysis {
  const files = contents.filter(
    (item) =>
      item.type === "file"
  );

  const directories = contents.filter(
    (item) =>
      item.type === "dir"
  );

  const totalFiles =
    files.length;

  const totalDirectories =
    directories.length;

  /* ================================================= */
  /* FILE CATEGORIES                                   */
  /* ================================================= */

  let sourceFiles = 0;
  let testFiles = 0;
  let configFiles = 0;
  let documentationFiles = 0;

  let totalCodeSize = 0;

  const languageMap =
    new Map<string, number>();

  const directoryMap =
    new Map<string, number>();

  for (const file of files) {
    const extension =
      getExtension(file.name);

    const path =
      file.path.toLowerCase();

    const size =
      file.size ?? 0;

    totalCodeSize += size;

    /* Source files */

    if (
      SOURCE_EXTENSIONS.has(
        extension
      )
    ) {
      sourceFiles += 1;

      const language =
        extension === "tsx" ||
        extension === "jsx"
          ? "JavaScript / TypeScript"
          : extension === "ts"
          ? "TypeScript"
          : extension === "js"
          ? "JavaScript"
          : extension.toUpperCase();

      languageMap.set(
        language,
        (languageMap.get(language) ??
          0) + 1
      );
    }

    /* Test files */

    if (isTestFile(path)) {
      testFiles += 1;
    }

    /* Config files */

    if (
      CONFIG_EXTENSIONS.has(
        extension
      ) ||
      file.name
        .toLowerCase()
        .startsWith(".env")
    ) {
      configFiles += 1;
    }

    /* Documentation */

    if (
      isDocumentationFile(
        file.name
      ) ||
      extension === "md"
    ) {
      documentationFiles += 1;
    }

    /* Directory distribution */

    const directory =
      getDirectory(file.path);

    directoryMap.set(
      directory,
      (directoryMap.get(
        directory
      ) ?? 0) + 1
    );
  }

  /* ================================================= */
  /* LANGUAGE DISTRIBUTION                             */
  /* ================================================= */

  const languages =
    Array.from(
      languageMap.entries()
    )
      .map(
        ([language, count]) => ({
          language,
          files: count,
          percentage:
            sourceFiles > 0
              ? Math.round(
                  (count /
                    sourceFiles) *
                    100
                )
              : 0,
        })
      )
      .sort(
        (a, b) =>
          b.files - a.files
      );

  /* ================================================= */
  /* LARGEST FILES                                     */
  /* ================================================= */

  const largestFiles =
    files
      .filter(
        (file) =>
          typeof file.size ===
          "number"
      )
      .sort(
        (a, b) =>
          (b.size ?? 0) -
          (a.size ?? 0)
      )
      .slice(0, 5)
      .map((file) => ({
        name: file.name,
        path: file.path,
        size: file.size ?? 0,
      }));

  /* ================================================= */
  /* TOP DIRECTORIES                                   */
  /* ================================================= */

  const topDirectories =
    Array.from(
      directoryMap.entries()
    )
      .map(
        ([name, count]) => ({
          name,
          files: count,
        })
      )
      .sort(
        (a, b) =>
          b.files - a.files
      )
      .slice(0, 5);

  /* ================================================= */
  /* TEST RATIO                                        */
  /* ================================================= */

  const testRatio =
    sourceFiles > 0
      ? Math.round(
          (testFiles /
            sourceFiles) *
            100
        )
      : 0;

  /* ================================================= */
  /* HEALTH SCORE                                      */
  /* ================================================= */

  let healthScore = 50;

  /* Source-code presence */

  if (sourceFiles > 0) {
    healthScore += 10;
  }

  /* Testing */

  if (testFiles > 0) {
    healthScore += 10;
  }

  if (testRatio >= 20) {
    healthScore += 10;
  } else if (
    testRatio >= 10
  ) {
    healthScore += 5;
  }

  /* Documentation */

  if (
    documentationFiles > 0
  ) {
    healthScore += 10;
  }

  /* Configuration */

  if (configFiles > 0) {
    healthScore += 5;
  }

  /*
   * Very large codebases receive
   * a small complexity penalty.
   */

  if (sourceFiles > 500) {
    healthScore -= 10;
  } else if (
    sourceFiles > 250
  ) {
    healthScore -= 5;
  }

  healthScore = Math.max(
    0,
    Math.min(
      100,
      healthScore
    )
  );

  const healthLevel =
    getHealthLevel(
      healthScore
    );

  /* ================================================= */
  /* INSIGHT                                           */
  /* ================================================= */

  const insight =
    generateInsight(
      totalFiles,
      sourceFiles,
      testFiles,
      documentationFiles,
      testRatio,
      healthLevel
    );

  /* ================================================= */
  /* RESULT                                            */
  /* ================================================= */

  return {
    totalFiles,
    totalDirectories,

    sourceFiles,
    testFiles,
    configFiles,
    documentationFiles,

    totalCodeSize,

    languages,
    largestFiles,
    topDirectories,

    testRatio,

    healthScore,
    healthLevel,

    insight,
  };
}