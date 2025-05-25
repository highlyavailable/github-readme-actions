# 🎓 Course List Action

Automatically showcase your educational background with a clean, organized table of college courses in your GitHub README.

## 🚀 Quick Start

### 1. Add Comments to Your README

Add the following comments to your `README.md` where you want the content to appear:

```markdown
## 🎓 Education & Coursework

<!--START_SECTION:github-readme-actions-course_list-->
<!--END_SECTION:github-readme-actions-course_list-->
```

### 2. Create Workflow File

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
| COURSE\_DATA             | JSON string containing course data with institutions       | Sample data | ❌        |
| MAX\_COURSES\_PER\_COLUMN | Maximum number of courses to display per institution      | 15      | ❌        |

## 🎨 Course Data Format

The `COURSE_DATA` input expects a JSON string with the following structure:

```json
[
  {
    "name": "University Name",
    "degree": "Degree Type (e.g., BS Computer Science)",
    "icon": "🏫",
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

### Basic Course List (Uses Sample Data)

```yaml
- uses: highlyavailable/github-readme-actions@main
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  with:
    ACTION_TYPE: 'course_list'
```

### Custom Course Data

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
          "name": "Stanford University",
          "degree": "MS Computer Science",
          "icon": "🌲",
          "courses": [
            {
              "code": "CS229",
              "name": "Machine Learning",
              "link": "https://cs229.stanford.edu/"
            },
            {
              "code": "CS231N",
              "name": "Convolutional Neural Networks for Visual Recognition",
              "link": "https://cs231n.stanford.edu/"
            },
            {
              "code": "CS224N",
              "name": "Natural Language Processing with Deep Learning",
              "link": "https://web.stanford.edu/class/cs224n/"
            }
          ]
        },
        {
          "name": "MIT",
          "degree": "BS Electrical Engineering",
          "icon": "🏛️",
          "courses": [
            {
              "code": "6.006",
              "name": "Introduction to Algorithms"
            },
            {
              "code": "6.034",
              "name": "Artificial Intelligence",
              "link": "https://ai6034.mit.edu/"
            }
          ]
        }
      ]
```

### Multiple Institutions with Limits

```yaml
- uses: highlyavailable/github-readme-actions@main
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  with:
    ACTION_TYPE: 'course_list'
    MAX_COURSES_PER_COLUMN: '8'
    COMMIT_MSG: '🎓 Updated education and coursework'
```

## 📊 Output Format

The action generates a clean, organized table showing your educational background:

| 🏫 **University of Wisconsin-Madison**<br/><sub>BS Computer Science & Data Science</sub> | 🐝 **Georgia Institute of Technology**<br/><sub>MS Computer Science</sub> |
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

## 🔧 Advanced Usage

### Using School-Specific Icons

```json
{
  "name": "Harvard University",
  "icon": "🏛️",
  "degree": "PhD Computer Science"
}
```

Popular institution icons:
- 🏫 Generic university
- 🌲 Stanford (tree theme)
- 🐝 Georgia Tech (Yellow Jackets)
- 🏛️ Harvard, MIT (classical architecture)
- 🐻 UC Berkeley (Golden Bears)
- 🌊 UC San Diego (ocean theme)

### Organizing by Time Period

You can organize institutions chronologically or by importance in your JSON data.

### Course Links Best Practices

- Link to official course pages when available
- Use department pages for courses without specific URLs
- Consider linking to course catalogs for older courses

## 📚 Examples

- [Basic Usage](../examples/basic-course-list.yml) - Simple setup with sample data
- [Advanced Configuration](../examples/advanced-course-list.yml) - Custom course data and settings

## 💡 Tips

1. **Keep it Current**: Update your course data as you complete new courses
2. **Highlight Key Courses**: Put your most relevant courses first in each institution
3. **Use Meaningful Links**: Link to course pages that showcase the curriculum
4. **Balance Detail**: Don't overwhelm with too many courses - focus on the most relevant ones
5. **Update Regularly**: Set up the workflow to run weekly to keep your profile fresh 