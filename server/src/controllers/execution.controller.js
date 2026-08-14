const axios = require('axios');

// Map frontend languages to Wandbox compiler names
const compilerMap = {
  javascript: 'nodejs-18.20.4',
  typescript: 'typescript-5.6.2',
  python: 'cpython-3.14.0',
  java: 'openjdk-jdk-21+35',
  c: 'gcc-head-c',
  cpp: 'gcc-head',
  csharp: 'dotnetcore-6.0.425',
  go: 'go-1.14.15',
  rust: 'rust-1.64.0',
  php: 'php-5.6.40',
  'node.js': 'nodejs-18.20.4'
};

/**
 * Local fallback code review.
 * Used when GEMINI_API_KEY is not configured.
 */
function basicHeuristicReview(code) {
  const suggestions = [];
  const lines = code.split('\n');

  lines.forEach((line, idx) => {
    if (/\bvar\b/.test(line)) {
      suggestions.push({
        line: idx + 1,
        issue: 'Uses "var"',
        suggestion: 'Use let or const instead of var.',
        category: 'code_smell'
      });
    }

    if (line.length > 120) {
      suggestions.push({
        line: idx + 1,
        issue: 'Long line',
        suggestion: 'Consider breaking this line up for readability.',
        category: 'code_smell'
      });
    }

    if (/\b(a|b|x|tmp|temp)\s*=/.test(line)) {
      suggestions.push({
        line: idx + 1,
        issue: 'Unclear variable name',
        suggestion: 'Use a descriptive variable name instead.',
        category: 'naming'
      });
    }
  });

  return suggestions.slice(0, 15);
}

/**
 * AI Code Reviewer
 * Uses Google Gemini API.
 *
 * @route POST /api/v1/execute/review
 */
exports.reviewCode = async (req, res) => {
  try {
    const { code, language } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Code is required for review.'
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    // ---------------------------------------------------------
    // No Gemini API key -> local fallback
    // ---------------------------------------------------------
    if (!apiKey) {
      return res.json({
        success: true,
        review: {
          summary:
            'Gemini API key is not configured. Showing a basic automated check instead.',
          suggestions: basicHeuristicReview(code),
          generatedBy: 'local-fallback'
        }
      });
    }

    // ---------------------------------------------------------
    // Gemini prompt
    // ---------------------------------------------------------
    const prompt = `
You are a senior software engineer and code reviewer.

Review the following ${language || 'programming'} code.

Check for:
- bugs
- code smells
- naming problems
- missing comments
- security issues
- performance issues
- bad practices

Return ONLY valid JSON in exactly this format:

{
  "summary": "short overall review",
  "suggestions": [
    {
      "line": 1,
      "issue": "description of issue",
      "suggestion": "how to improve it",
      "category": "bug"
    }
  ]
}

The category must be one of:
bug,
code_smell,
naming,
missing_comment,
security,
performance

If there are no issues, return:

{
  "summary": "The code looks clean.",
  "suggestions": []
}

Code:

${code.slice(0, 6000)}
`;

    // ---------------------------------------------------------
    // Gemini API request
    // ---------------------------------------------------------
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json'
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    // ---------------------------------------------------------
    // Extract Gemini response
    // ---------------------------------------------------------
    const generatedText =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error('Gemini returned an empty response.');
    }

    // Remove accidental markdown code fences
    const cleanedText = generatedText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    let parsed;

    try {
      parsed = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Gemini JSON parse error:', parseError.message);
      console.error('Gemini raw response:', generatedText);

      return res.status(500).json({
        success: false,
        message: 'Gemini returned an invalid review response.'
      });
    }

    res.json({
      success: true,
      review: {
        summary: parsed.summary || 'Code review completed.',
        suggestions: Array.isArray(parsed.suggestions)
          ? parsed.suggestions
          : [],
        generatedBy: 'gemini'
      }
    });

  } catch (error) {
    console.error(
      'AI review error:',
      error.response?.data || error.message || error
    );

    res.status(500).json({
      success: false,
      message: 'Failed to generate AI code review.',
      error:
        error.response?.data?.error?.message ||
        error.message ||
        'Unknown AI review error.'
    });
  }
};

/**
 * Execute code using Wandbox API
 *
 * @route POST /api/v1/execute
 */
exports.executeCode = async (req, res, next) => {
  try {
    const { language, code } = req.body;

    if (!language || !code) {
      return res.status(400).json({
        success: false,
        message: 'Language and code are required fields.'
      });
    }

    const compiler = compilerMap[language.toLowerCase()];

    if (!compiler) {
      return res.status(400).json({
        success: false,
        message: `Unsupported language: ${language}`
      });
    }

    const response = await axios.post(
      'https://wandbox.org/api/compile.json',
      {
        compiler,
        code,
        save: false
      }
    );

    const data = response.data;

    res.status(200).json({
      success: true,
      compile: {
        output: data.compiler_message || data.compiler_error || ''
      },
      run: {
        stdout: data.program_message || data.program_output || '',
        stderr: data.program_error || ''
      },
      data
    });

  } catch (error) {
    console.error(
      'Execution Error:',
      error.message || error
    );

    res.status(500).json({
      success: false,
      message: 'Failed to execute code on server.',
      error: error.message,
      stack: error.stack
    });
  }
};