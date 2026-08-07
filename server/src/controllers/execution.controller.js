const axios = require('axios');

const pistonLanguageMap = {
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
  java: 'java',
  c: 'c',
  cpp: 'c++',
  csharp: 'csharp',
  go: 'go',
  rust: 'rust',
  php: 'php'
};

/**
 * Execute code using Piston API
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

    const pistonLang = pistonLanguageMap[language.toLowerCase()];
    
    if (!pistonLang) {
      return res.status(400).json({
        success: false,
        message: `Unsupported language: ${language}`
      });
    }

    // Call Piston API
    const response = await axios.post('https://emkc.org/api/v2/piston/execute', {
      language: pistonLang,
      version: '*',
      files: [
        {
          content: code
        }
      ]
    });

    const data = response.data;
    
    res.status(200).json({
      success: true,
      compile: {
        output: data.compile?.output || ''
      },
      run: {
        stdout: data.run?.stdout || '',
        stderr: data.run?.stderr || ''
      },
      data: data
    });

  } catch (error) {
    console.error('Execution Error:', error.message || error);
    res.status(500).json({
      success: false,
      message: 'Failed to execute code on server.',
      error: error.message,
      stack: error.stack
    });
  }
};
