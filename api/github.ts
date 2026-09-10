export default {
  async fetch(request: Request) {
    if (request.method !== "GET") {
      return Response.json(
        {
          error: "Method not allowed",
        },
        { status: 405 }
      );
    }

    const url = new URL(request.url);
    const path = url.searchParams.get("path") ?? "";

    if (!path || !path.startsWith("/")) {
      return Response.json(
        {
          error: "Invalid GitHub API path",
        },
        { status: 400 }
      );
    }

    const token = process.env.GITHUB_TOKEN;

    if (!token) {
      return Response.json(
        {
          error: "GitHub token is not configured.",
        },
        { status: 500 }
      );
    }

    try {
      const githubResponse = await fetch(
        `https://api.github.com${path}`,
        {
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${token}`,
            "X-GitHub-Api-Version": "2026-03-10",
          },
        }
      );

      const data = await githubResponse.json();

      return Response.json(data, {
        status: githubResponse.status,
      });
    } catch {
      return Response.json(
        {
          error: "Unable to connect to GitHub.",
        },
        { status: 500 }
      );
    }
  },
};