# 🎓 Course List Action

Automatically showcase your educational background with a clean, organized table of college courses in your GitHub README.

## 🚀 Quick Start (File-Based Approach - Recommended)

### 1. Add Comments to Your README

Add the following comments to your `README.md` where you want the content to appear:

```markdown
## 🎓 Education & Coursework

<!--START_SECTION:github-readme-actions-course_list-->
<!--END_SECTION:github-readme-actions-course_list-->
```

### 2. Create Course Data File

Create `.github/course-data.json` in your repository:

```json
[
  {
    "name": "Your University",
    "degree": "Your Degree",
    "icon": "🎓",
    "courses": [
      {
        "code": "CS101",
        "name": "Introduction to Computer Science",
        "link": "https://example.edu/cs101"
      }
    ]
  }
]
```

### 3. Create Workflow File

Create `.github/workflows/update-readme.yml`:

```yaml
name: Update README with Course List

on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday
  workflow_dispatch:

jobs:
  update-readme:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    
    steps:
      - uses: actions/checkout@v4
      - uses: highlyavailable/github-readme-actions@main
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          ACTION_TYPE: 'course_list'
```

The action will automatically find and use your `.github/course-data.json` file!

## 📋 Configuration Options

### Core Inputs

| Input         | Description                                                     | Default                                                 | Required |
| ------------- | --------------------------------------------------------------- | ------------------------------------------------------- | -------- |
| GITHUB\_TOKEN | GitHub token for API access (can be provided via with: or env:) | \-                                                      | ✅        |
| GH\_USERNAME  | GitHub username to fetch data for                               | Repository owner                                        | ❌        |
| TARGET\_FILE  | File to update                                                  | README.md                                               | ❌        |
| COMMIT\_MSG   | Commit message                                                  | 🚀 Update README with GitHub actions                    | ❌        |
| COMMIT\_NAME  | Committer name                                                  | github-actions\[bot\]                                   | ❌        |
| COMMIT\_EMAIL | Committer email                                                 | 41898282+github-actions\[bot\]@users.noreply.github.com | ❌        |

### Course List Specific Inputs

| Input                    | Description                                                | Default | Required |
| ------------------------ | ---------------------------------------------------------- | ------- | -------- |
| COURSE\_DATA\_FILE       | Path to JSON file containing course data                   | Auto-detected | ❌        |
| COURSE\_DATA             | JSON string containing course data with institutions       | Sample data | ❌        |
| MAX\_COURSES\_PER\_COLUMN | Maximum number of courses to display per institution      | 15      | ❌        |

**Note**: The action will look for course data in this priority order:

1. `COURSE_DATA_FILE` input (custom file path)
2. Auto-detected files: `.github/course-data.json`, `course-data.json`, `.github/courses.json`, `courses.json`
3. `COURSE_DATA` input (JSON string)
4. Sample data (fallback)

## 📁 File-Based Setup (Recommended)

The easiest way to maintain your course data is to create a JSON file in your repository:

### 1. Create Course Data File

Create `.github/course-data.json` in your repository:

```json
[
  {
    "name": "Your University",
    "degree": "Your Degree",
    "icon": "🎓",
    "courses": [
      {
        "code": "CS101",
        "name": "Introduction to Computer Science",
        "link": "https://example.edu/cs101"
      }
    ]
  }
]
```

### 2. Simple Workflow

```yaml
- uses: highlyavailable/github-readme-actions@main
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  with:
    ACTION_TYPE: 'course_list'
```

The action will automatically find and use your `.github/course-data.json` file!

### 3. Custom File Location

```yaml
- uses: highlyavailable/github-readme-actions@main
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  with:
    ACTION_TYPE: 'course_list'
    COURSE_DATA_FILE: 'my-education.json'
```

## 🎨 Course Data Format

The course data (whether in a file or as a JSON string) should follow this structure:

```json
[
  {
    "name": "University Name",
    "degree": "Degree Type (e.g., BS Computer Science)",
    "icon": "🦡",
    "courses": [
      {
        "code": "CS101",
        "name": "Introduction to Computer Science",
        "link": "https://example.edu/cs101"
      }
    ]
  }
]
```

### Field Descriptions

- **name**: Full name of the educational institution
- **degree**: Degree type and major (e.g., "BS Computer Science", "MS Data Science")
- **icon**: Emoji icon to represent the institution (optional, defaults to 🎓)
- **courses**: Array of course objects
  - **code**: Course code/number (e.g., "CS577", "MATH340")
  - **name**: Full course name
  - **link**: URL to course page (optional)

## 🎨 Example Configurations

### File-Based Setup (Recommended)

```yaml
- uses: highlyavailable/github-readme-actions@main
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  with:
    ACTION_TYPE: 'course_list'
```

### Custom File Location

```yaml
- uses: highlyavailable/github-readme-actions@main
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  with:
    ACTION_TYPE: 'course_list'
    COURSE_DATA_FILE: 'my-education.json'
    MAX_COURSES_PER_COLUMN: '8'
    COMMIT_MSG: '🎓 Updated education and coursework'
```

### Inline Course Data (Alternative Approach)

```yaml
- uses: highlyavailable/github-readme-actions@main
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  with:
    ACTION_TYPE: 'course_list'
    MAX_COURSES_PER_COLUMN: '10'
    COURSE_DATA: |
      [
        {
          "name": "University of Wisconsin-Madison",
          "degree": "BS Computer Science & Data Science",
          "icon": "🦡",
          "courses": [
            {
              "code": "CS577",
              "name": "Intro to Algorithms",
              "link": "https://pages.cs.wisc.edu/~shuchi/courses/787-F07/"
            },
            {
              "code": "CS564",
              "name": "Database Management Systems",
              "link": "https://pages.cs.wisc.edu/~paris/cs564-f21/"
            },
            {
              "code": "CS540",
              "name": "Artificial Intelligence",
              "link": "https://pages.cs.wisc.edu/~dpage/cs540/"
            }
          ]
        },
        {
          "name": "Georgia Institute of Technology",
          "degree": "MS Computer Science",
          "icon": "🐝",
          "courses": [
            {
              "code": "CS6300",
              "name": "Software Development Process",
              "link": "https://omscs.gatech.edu/cs-6300-software-development-process"
            },
            {
              "code": "CS7632",
              "name": "Game AI",
              "link": "https://omscs.gatech.edu/cs-7632-game-ai"
            }
          ]
        }
      ]
```

### Basic Course List (Uses Sample Data)

```yaml
- uses: highlyavailable/github-readme-actions@main
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  with:
    ACTION_TYPE: 'course_list'
```

## 📊 Output Format

The action generates a clean, organized table showing your educational background:

| 🦡 **University of Wisconsin-Madison**<br/><sub>BS Computer Science & Data Science</sub> | 🐝 **Georgia Institute of Technology**<br/><sub>MS Computer Science</sub> |
|---|---|
| [CS577 Intro to Algorithms](https://pages.cs.wisc.edu/~shuchi/courses/787-F07/) | [CS6300 Software Development Process](https://omscs.gatech.edu/cs-6300-software-development-process) |
| [CS564 Database Management Systems](https://pages.cs.wisc.edu/~paris/cs564-f21/) | [CS7632 Game AI](https://omscs.gatech.edu/cs-7632-game-ai) |
| [CS540 Artificial Intelligence](https://pages.cs.wisc.edu/~dpage/cs540/) | [CS6400 Database Systems Concepts and Design](https://omscs.gatech.edu/cs-6400-database-systems-concepts-and-design) |

### Features

- **Clean Layout**: Organized table format with institution headers
- **Degree Information**: Shows degree type and major under institution name
- **Institution Icons**: Customizable emojis for visual appeal
- **Clickable Links**: Course names link to course pages when available
- **Responsive Design**: Works well on both desktop and mobile
- **Truncation Support**: Shows "... and X more" when courses exceed the limit

## 📚 Examples

- [Basic Usage](../examples/basic-course-list.yml) - Simple setup with sample data
- [Advanced Configuration](../examples/advanced-course-list.yml) - Custom course data and settings
