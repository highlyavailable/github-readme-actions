const core = require('@actions/core');
const fs = require('fs');
const path = require('path');

const START_COMMENT = '<!--START_SECTION:github-readme-actions-course_list-->';
const END_COMMENT = '<!--END_SECTION:github-readme-actions-course_list-->';

/**
 * Try to read course data from a file in the repository
 */
function readCourseDataFromFile(filePath) {
  const possiblePaths = [
    filePath,
    '.github/course-data.json',
    'course-data.json',
    '.github/courses.json',
    'courses.json'
  ].filter(Boolean);

  for (const possiblePath of possiblePaths) {
    try {
      if (fs.existsSync(possiblePath)) {
        const fileContent = fs.readFileSync(possiblePath, 'utf8');
        core.info(`Found course data file: ${possiblePath}`);
        return JSON.parse(fileContent);
      }
    } catch (error) {
      core.warning(`Failed to read course data from ${possiblePath}: ${error.message}`);
    }
  }

  return null;
}

/**
 * Parse course data from input or file
 * Priority: 1. COURSE_DATA input, 2. COURSE_DATA_FILE input, 3. Default file locations, 4. Sample data
 */
function parseCourseData(courseDataInput, courseDataFile) {
  // First, try the direct COURSE_DATA input
  if (courseDataInput) {
    try {
      core.info('Using course data from COURSE_DATA input');
      return JSON.parse(courseDataInput);
    } catch (error) {
      core.warning(`Failed to parse COURSE_DATA input: ${error.message}`);
    }
  }

  // Second, try reading from file
  const fileData = readCourseDataFromFile(courseDataFile);
  if (fileData) {
    return fileData;
  }

  // Fallback to sample data
  core.info('No course data found, using sample data');
  return [
    {
      name: "University of Wisconsin-Madison",
      degree: "BS Computer Science & Data Science",
      icon: "🦡",
      courses: [
        { code: "CS577", name: "Intro to Algorithms", link: "https://pages.cs.wisc.edu/~shuchi/courses/787-F07/" },
        { code: "CS564", name: "Database Management Systems", link: "https://pages.cs.wisc.edu/~paris/cs564-f21/" },
        { code: "CS540", name: "Artificial Intelligence", link: "https://pages.cs.wisc.edu/~dpage/cs540/" },
        { code: "MATH541", name: "Modern Algebra II", link: "https://www.math.wisc.edu/~anderson/541F08/" },
        { code: "MATH540", name: "Modern Algebra I", link: "https://www.math.wisc.edu/~anderson/540F08/" },
        { code: "CS537", name: "Intro to Operating Systems", link: "https://pages.cs.wisc.edu/~remzi/Classes/537/Spring2018/" },
        { code: "CS524", name: "Optimization", link: "https://pages.cs.wisc.edu/~ferris/cs524/" },
        { code: "CS506", name: "Software Engineering", link: "https://pages.cs.wisc.edu/~cs506/" },
        { code: "STAT436", name: "Statistical Data Visualization", link: "https://pages.cs.wisc.edu/~sscheidegger/436/" },
        { code: "CS400", name: "Java Programming III", link: "https://pages.cs.wisc.edu/~cs400/" }
      ]
    },
    {
      name: "Georgia Institute of Technology",
      degree: "MS Computer Science",
      icon: "🐝",
      courses: [
        { code: "CS6300", name: "Software Development Process", link: "https://omscs.gatech.edu/cs-6300-software-development-process" },
        { code: "CS7632", name: "Game AI", link: "https://omscs.gatech.edu/cs-7632-game-ai" },
        { code: "CS6400", name: "Database Systems Concepts and Design", link: "https://omscs.gatech.edu/cs-6400-database-systems-concepts-and-design" },
        { code: "CS6250", name: "Computer Networks", link: "https://omscs.gatech.edu/cs-6250-computer-networks" },
        { code: "CS7646", name: "Machine Learning for Trading", link: "https://omscs.gatech.edu/cs-7646-machine-learning-trading" },
        { code: "CS7637", name: "Knowledge-Based Artificial Intelligence", link: "https://omscs.gatech.edu/cs-7637-knowledge-based-artificial-intelligence-cognitive-systems" }
      ]
    }
  ];
}

/**
 * Format a single course entry
 */
function formatCourse(course) {
  if (course.link) {
    return `[${course.code} ${course.name}](${course.link})`;
  }
  return `${course.code} ${course.name}`;
}

/**
 * Generate course table content
 */
function generateCourseTable(institutions, maxCoursesPerColumn) {
  if (institutions.length === 0) {
    return 'No course data available.';
  }

  // Create table header
  const headers = institutions.map(inst => 
    `${inst.icon || '🎓'} **${inst.name}**<br/><sub>${inst.degree}</sub>`
  );
  
  const headerRow = `| ${headers.join(' | ')} |`;
  const separatorRow = `|${headers.map(() => '---').join('|')}|`;
  
  // Find the maximum number of courses across all institutions
  const maxCourses = Math.min(
    Math.max(...institutions.map(inst => inst.courses.length)),
    maxCoursesPerColumn
  );
  
  // Generate course rows
  const courseRows = [];
  for (let i = 0; i < maxCourses; i++) {
    const row = institutions.map(inst => {
      if (i < inst.courses.length) {
        return formatCourse(inst.courses[i]);
      }
      return ''; // Empty cell if institution has fewer courses
    });
    courseRows.push(`| ${row.join(' | ')} |`);
  }
  
  // Add "show more" indicators if courses were truncated
  const showMoreRow = institutions.map(inst => {
    const remaining = inst.courses.length - maxCoursesPerColumn;
    if (remaining > 0) {
      return `<sub>... and ${remaining} more</sub>`;
    }
    return '';
  });
  
  const hasShowMore = showMoreRow.some(cell => cell !== '');
  if (hasShowMore) {
    courseRows.push(`| ${showMoreRow.join(' | ')} |`);
  }
  
  return [headerRow, separatorRow, ...courseRows].join('\n');
}

/**
 * Execute course list action
 */
async function executeCourseListAction(octokit, inputs) {
  core.info(`Generating course list for ${inputs.username}`);
  
  const institutions = parseCourseData(inputs.courseData, inputs.courseDataFile);
  
  core.info(`Found ${institutions.length} institutions with courses`);
  
  // Generate content
  const content = generateCourseTable(institutions, inputs.maxCoursesPerColumn);
  
  return {
    content,
    startComment: START_COMMENT,
    endComment: END_COMMENT,
    metadata: {
      institutionCount: institutions.length,
      totalCourses: institutions.reduce((sum, inst) => sum + inst.courses.length, 0)
    }
  };
}

module.exports = {
  executeCourseListAction,
  START_COMMENT,
  END_COMMENT
}; 