const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const executeCode = async (req, res) => {
  try {
    const { language, code } = req.body;

    if (!language || !code) {
      return res.status(400).json({
        success: false,
        message: "Language and Code are required",
      });
    }

    // Map language IDs to file extensions and run commands
    const langMap = {
      javascript: { ext: "js", cmd: "node" },
      python: { ext: "py", cmd: "python" },
    };

    const config = langMap[language];

    if (!config) {
      return res.status(400).json({
        success: false,
        message: `Language '${language}' is not supported locally. Only JavaScript and Python are supported.`,
      });
    }

    // Create temp directory if it doesn't exist
    const tempDir = path.join(__dirname, "../temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Generate unique file path
    const fileId = `run_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const fileName = `${fileId}.${config.ext}`;
    const filePath = path.join(tempDir, fileName);

    // Write code content to the temp file
    fs.writeFileSync(filePath, code);

    // Build the execution command
    const executeCommand = `${config.cmd} "${filePath}"`;

    // Execute the command with a 5-second timeout to prevent hangs/infinite loops
    exec(executeCommand, { timeout: 5000 }, (error, stdout, stderr) => {
      // Clean up (delete the temp file)
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.error("Temp file cleanup failed:", err);
      }

      // Check if command execution timed out
      if (error && error.killed) {
        return res.status(200).json({
          run: {
            stdout: "",
            stderr: "Execution Timed Out (Limit: 5 seconds). Ensure there are no infinite loops in your code.",
          },
        });
      }

      // Handle standard response (even if command error occurred, e.g. python exception)
      // We pass the stderr and stdout back to the user
      return res.status(200).json({
        run: {
          stdout: stdout || "",
          stderr: stderr || (error ? error.message : ""),
        },
      });
    });
  } catch (err) {
    console.error("ExecuteCode Server Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server Error during local code execution",
    });
  }
};

module.exports = {
  executeCode,
};
