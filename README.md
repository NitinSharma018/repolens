# RepoLens

> Understand GitHub repositories at a glance.

RepoLens is a web-based GitHub repository intelligence dashboard that transforms raw GitHub repository data into readable statistics, visual analytics, health metrics, and actionable insights.

Instead of manually exploring multiple sections of a GitHub repository, RepoLens brings important repository information together in a single dashboard.

---

## Overview

GitHub provides a large amount of information about repositories, but understanding the overall health and activity of a project can require checking multiple sections individually.

RepoLens simplifies this process by analyzing publicly available GitHub data and presenting it through a centralized dashboard.

A user can enter either:

- A GitHub username
- A GitHub repository URL
- An `owner/repository` format

RepoLens then retrieves the relevant GitHub data and generates an analysis.

---

## Features

### GitHub Profile Analysis

Enter a GitHub username to view:

- Profile information
- Avatar
- Bio
- Public repositories
- Followers
- Following
- Public gists
- Account creation date
- Profile update information

---

### Repository Analysis

Analyze a public GitHub repository and view:

- Repository name
- Repository owner
- Description
- Stars
- Forks
- Watchers
- Open issues
- Primary programming language
- Default branch
- License
- Repository creation date
- Last update
- Last push
- Repository topics

---

### Language Analytics

RepoLens analyzes the language data returned by GitHub and presents the repository's code composition visually.

The dashboard includes:

- Detected programming languages
- Percentage distribution
- Code size by language
- Interactive language visualization

---

### Activity Analysis

RepoLens analyzes recent repository activity using commit data from the last 30 days.

It provides:

- Total commits detected
- Latest commit
- Last repository push
- Daily commit activity
- 30-day activity chart
- Recent commit history

---

### Repository Health Score

RepoLens calculates an overall repository health score based on multiple measurable GitHub signals.

The current scoring model is:

| Metric | Weight |
|--------|--------|
| Activity | 25% |
| Maintenance | 25% |
| Community | 20% |
| Popularity | 15% |
| Documentation | 15% |

The final score is represented on a scale of:

`0 - 100`

This score is intended as a simplified analytical indicator rather than an official GitHub metric.

---

### Documentation Analysis

RepoLens checks repository-level documentation signals such as:

- README
- License
- Contributing guidelines
- Code of Conduct

The documentation score is calculated using the presence of these signals.

---

### Automated Insights

Based on the collected repository data, RepoLens generates readable observations such as:

- Strong development activity
- Recent maintenance activity
- Significant community visibility
- Community fork activity
- Documentation coverage
- Areas where repository health could be improved

---

### Responsive Design

RepoLens is designed to work across:

- Desktop
- Laptop
- Tablet
- Mobile devices

The dashboard adapts its layout according to the available screen size.

---

## How It Works

The basic workflow of RepoLens is:

```text
User Input
    |
    v
Parse GitHub Username / Repository
    |
    v
GitHub REST API
    |
    v
Retrieve Repository Data
    |
    +--------------------+
    |                    |
    v                    v
Languages             Commits
    |                    |
    +---------+----------+
              |
              v
       Data Processing
              |
      +-------+-------+
      |       |       |
      v       v       v
  Analytics Health  Insights
      |       |       |
      +-------+-------+
              |
              v
       RepoLens Dashboard

Health Score Methodology

The repository health score is calculated using five categories.

1. Activity — 25%

Measures recent development activity using signals such as:

Number of commits detected in the last 30 days
Recency of repository pushes

Higher recent activity contributes to a higher score.

2. Maintenance — 25%

Evaluates how recently the repository was updated.

Recent pushes receive a higher maintenance score, while repositories that have not been updated for a long period receive a lower score.

3. Community — 20%

Uses community-related repository signals such as:

Fork count
Open issues

These values provide an indication of community interaction with the repository.

4. Popularity — 15%

Uses repository star count as a popularity signal.

The calculation uses a logarithmic scale so that extremely popular repositories do not completely dominate the overall score.

5. Documentation — 15%

Evaluates the presence of documentation-related files and metadata:

README
License
Contributing guidelines
Code of Conduct
Tech Stack
Frontend
React
TypeScript
Vite
CSS
Data Visualization
Recharts
Icons
Lucide React
API
GitHub REST API
Development Tools
Node.js
npm
Git
Project Structure
repolens/
│
├── public/
│
├── src/
│   ├── services/
│   │   └── githubApi.ts
│   │
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
│
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── README.md
Getting Started
Prerequisites

Make sure the following are installed:

Node.js
npm
Git

You can verify the installation using:

node --version
npm --version
git --version
Installation

Clone the repository:

git clone https://github.com/YOUR_USERNAME/repolens.git

Navigate into the project:

cd repolens

Install dependencies:

npm install
Running the Development Server

Start the development server:

npm run dev

Vite will provide a local development URL, usually:

http://localhost:5173

Open the URL in your browser.

Production Build

To create a production build:

npm run build

The production files will be generated inside:

dist/
Usage
Analyze a Repository

Enter a repository in one of the following formats:

facebook/react

or:

https://github.com/facebook/react

Then click:

Analyze

RepoLens retrieves the repository information and displays the analysis dashboard.

Analyze a GitHub Profile

Enter a GitHub username:

torvalds

RepoLens will display the available public profile information.

API Usage

RepoLens uses the GitHub REST API to retrieve publicly available GitHub information.

The application currently retrieves data related to:

Users
Repositories
Repository languages
Repository commits
Repository contents

The API integration is implemented in:

src/services/githubApi.ts
Error Handling

RepoLens handles common API-related situations including:

Invalid usernames
Invalid repositories
Missing GitHub resources
API rate limits
Authentication-related API responses
Empty input

Instead of displaying a blank page, the application provides an appropriate error message to the user.

Limitations

RepoLens currently has some limitations.

GitHub API Rate Limits

The application relies on GitHub's public API endpoints. API requests are subject to GitHub's rate limits.

Public Repository Data

The application is primarily designed around publicly accessible GitHub data.

Health Score

The health score is a project-specific analytical model created for RepoLens. It is not an official GitHub metric.

Commit Analysis

The activity chart currently focuses on commit activity detected during the most recent 30-day period.

Design Philosophy

RepoLens follows a simple principle:

Raw GitHub data is useful. Understanding it is better.

The goal is not to replace GitHub, but to provide a faster way to understand the important signals of a repository without manually navigating through multiple GitHub sections.

Future Improvements

Possible future improvements include:

GitHub authentication
Extended commit history
Pull request analytics
Issue trend analysis
Contributor analytics
Repository comparison
More advanced health scoring
Historical repository trends
Additional visualizations
Performance optimization
API caching
More detailed repository insights
Development

To modify the project locally:

npm install
npm run dev

After making changes, verify the production build:

npm run build
License

This project is intended as a portfolio and learning project.

A specific open-source license can be added if the project is distributed for reuse.

Author

Built as a personal developer project to explore:

React
TypeScript
GitHub API integration
Data visualization
Repository analytics
Frontend dashboard development
Repository Status

RepoLens is currently in a completed first production-ready implementation.

The current implementation includes GitHub profile analysis, repository analysis, language analytics, activity visualization, documentation signals, repository health scoring, and automated insights.