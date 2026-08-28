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