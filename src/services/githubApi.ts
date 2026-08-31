const GITHUB_API = "https://api.github.com";

const headers = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2026-03-10",
};

/* ================================================= */
/* GITHUB USER                                       */
/* ================================================= */

export type GitHubUser = {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  bio: string | null;

  public_repos: number;
  followers: number;
  following: number;
  public_gists: number;

  created_at: string;
  updated_at: string;
};

/* ================================================= */
/* GITHUB REPOSITORY                                 */
/* ================================================= */

export type GitHubRepository = {
  id: number;

  name: string;
  full_name: string;
  html_url: string;

  description: string | null;

  owner: {
    login: string;
    avatar_url: string;
    html_url: string;
  };

  private: boolean;

  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;

  language: string | null;

  size: number;

  default_branch: string;

  created_at: string;
  updated_at: string;
  pushed_at: string | null;

  license: {
    name: string;
    spdx_id: string | null;
  } | null;

  topics: string[];
};

/* ================================================= */
/* COMMIT                                            */
/* ================================================= */

export type GitHubCommit = {
  sha: string;

  html_url: string;

  commit: {
    message: string;

    author: {
      name: string;
      email: string;
      date: string;
    } | null;

    committer: {
      name: string;
      email: string;
      date: string;
    } | null;
  };

  author: {
    login: string;
    avatar_url: string;
  } | null;
};

/* ================================================= */
/* CONTRIBUTOR STATISTICS                           */
/* ================================================= */

export type GitHubContributorWeek = {
  w: number;
  a: number;
  d: number;
  c: number;
};

export type GitHubContributor = {
  author: {
    login: string;
    avatar_url: string;
    html_url: string;
  } | null;

  total: number;

  weeks: GitHubContributorWeek[];
};

/* ================================================= */
/* ISSUES                                            */
/* ================================================= */

export type GitHubIssue = {
  id: number;
  number: number;

  title: string;

  html_url: string;

  state: "open" | "closed";

  created_at: string;
  updated_at: string;
  closed_at: string | null;

  user: {
    login: string;
    avatar_url: string;
    html_url: string;
  } | null;

  comments: number;

  pull_request?: {
    url: string;
    html_url: string;
  };
};

/* ================================================= */
/* PULL REQUEST                                      */
/* ================================================= */

export type GitHubPullRequest = {
  id: number;
  number: number;

  title: string;

  html_url: string;

  state: "open" | "closed";

  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;

  user: {
    login: string;
    avatar_url: string;
    html_url: string;
  } | null;

  comments: number;
  commits: number;
  additions: number;
  deletions: number;
  changed_files: number;

  draft: boolean | null;
};

/* ================================================= */
/* CONTENT                                           */
/* ================================================= */

export type GitHubContent = {
  name: string;
  path: string;

  type: "file" | "dir";

  size?: number;
};

/* ================================================= */
/* ERROR HANDLER                                     */
/* ================================================= */

function handleGitHubError(
  response: Response
): never {
  if (response.status === 404) {
    throw new Error(
      "GitHub resource not found. Please check the username or repository."
    );
  }

  if (
    response.status === 403 ||
    response.status === 429
  ) {
    throw new Error(
      "GitHub API rate limit reached. Please try again later."
    );
  }

  if (response.status === 401) {
    throw new Error(
      "GitHub authentication is required for this request."
    );
  }

  if (response.status === 202) {
    throw new Error(
      "GitHub is still calculating repository statistics. Please try again."
    );
  }

  throw new Error(
    "Unable to fetch data from GitHub."
  );
}

/* ================================================= */
/* GET USER                                          */
/* ================================================= */

export async function getGitHubUser(
  username: string
): Promise<GitHubUser> {
  const response = await fetch(
    `${GITHUB_API}/users/${encodeURIComponent(
      username
    )}`,
    {
      headers,
    }
  );

  if (!response.ok) {
    handleGitHubError(response);
  }

  return response.json();
}

/* ================================================= */
/* GET REPOSITORY                                    */
/* ================================================= */

export async function getGitHubRepository(
  owner: string,
  repository: string
): Promise<GitHubRepository> {
  const response = await fetch(
    `${GITHUB_API}/repos/${encodeURIComponent(
      owner
    )}/${encodeURIComponent(
      repository
    )}`,
    {
      headers,
    }
  );

  if (!response.ok) {
    handleGitHubError(response);
  }

  return response.json();
}

/* ================================================= */
/* GET LANGUAGES                                     */
/* ================================================= */

export async function getRepositoryLanguages(
  owner: string,
  repository: string
): Promise<Record<string, number>> {
  const response = await fetch(
    `${GITHUB_API}/repos/${encodeURIComponent(
      owner
    )}/${encodeURIComponent(
      repository
    )}/languages`,
    {
      headers,
    }
  );

  if (!response.ok) {
    handleGitHubError(response);
  }

  return response.json();
}

/* ================================================= */
/* GET RECENT COMMITS                                */
/* ================================================= */

export async function getRepositoryCommits(
  owner: string,
  repository: string,
  since: string
): Promise<GitHubCommit[]> {
  const params = new URLSearchParams({
    since,
    per_page: "30",
  });

  const response = await fetch(
    `${GITHUB_API}/repos/${encodeURIComponent(
      owner
    )}/${encodeURIComponent(
      repository
    )}/commits?${params.toString()}`,
    {
      headers,
    }
  );

  if (!response.ok) {
    handleGitHubError(response);
  }

  return response.json();
}

/* ================================================= */
/* GET CONTRIBUTOR STATISTICS                       */
/* ================================================= */

export async function getRepositoryContributors(
  owner: string,
  repository: string
): Promise<GitHubContributor[]> {
  const response = await fetch(
    `${GITHUB_API}/repos/${encodeURIComponent(
      owner
    )}/${encodeURIComponent(
      repository
    )}/stats/contributors`,
    {
      headers,
    }
  );

  /*
   * GitHub may return 202 while statistics
   * are still being calculated.
   */
  if (response.status === 202) {
    throw new Error(
      "GitHub is still calculating contributor statistics. Please try again in a moment."
    );
  }

  if (!response.ok) {
    handleGitHubError(response);
  }

  return response.json();
}

/* ================================================= */
/* GET ISSUES                                        */
/* ================================================= */

export async function getRepositoryIssues(
  owner: string,
  repository: string
): Promise<GitHubIssue[]> {
  const params = new URLSearchParams({
    state: "all",
    per_page: "100",
  });

  const response = await fetch(
    `${GITHUB_API}/repos/${encodeURIComponent(
      owner
    )}/${encodeURIComponent(
      repository
    )}/issues?${params.toString()}`,
    {
      headers,
    }
  );

  if (!response.ok) {
    handleGitHubError(response);
  }

  return response.json();
}

/* ================================================= */
/* GET PULL REQUESTS                                 */
/* ================================================= */

export async function getRepositoryPullRequests(
  owner: string,
  repository: string
): Promise<GitHubPullRequest[]> {
  const params = new URLSearchParams({
    state: "all",
    per_page: "100",
  });

  const response = await fetch(
    `${GITHUB_API}/repos/${encodeURIComponent(
      owner
    )}/${encodeURIComponent(
      repository
    )}/pulls?${params.toString()}`,
    {
      headers,
    }
  );

  if (!response.ok) {
    handleGitHubError(response);
  }

  return response.json();
}

/* ================================================= */
/* GET ROOT CONTENTS                                 */
/* ================================================= */

export async function getRepositoryContents(
  owner: string,
  repository: string
): Promise<GitHubContent[]> {
  const response = await fetch(
    `${GITHUB_API}/repos/${encodeURIComponent(
      owner
    )}/${encodeURIComponent(
      repository
    )}/contents`,
    {
      headers,
    }
  );

  if (!response.ok) {
    handleGitHubError(response);
  }

  return response.json();
}

/* ================================================= */
/* GET REPOSITORY CONTENTS RECURSIVELY              */
/* ================================================= */

export async function getRepositoryTree(
  owner: string,
  repository: string
): Promise<GitHubContent[]> {
  const response = await fetch(
    `${GITHUB_API}/repos/${encodeURIComponent(
      owner
    )}/${encodeURIComponent(
      repository
    )}/git/trees/HEAD?recursive=1`,
    {
      headers,
    }
  );

  if (!response.ok) {
    handleGitHubError(response);
  }

  const data = await response.json();

  return (data.tree ?? []).map(
    (item: {
      path: string;
      type: "blob" | "tree";
      size?: number;
    }) => ({
      name:
        item.path.split("/").pop() ??
        item.path,

      path: item.path,

      type:
        item.type === "tree"
          ? "dir"
          : "file",

      size: item.size,
    })
  );
}