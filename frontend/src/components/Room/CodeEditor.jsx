import { useEffect, useState, useRef } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";
import { Play, Copy, Check, Terminal, RotateCcw, ChevronUp, ChevronDown, Code, Moon, Sun } from "lucide-react";
import "./CodeEditor.css";

const LANGUAGES = [
    { id: "javascript", label: "JavaScript (Node.js)", version: "18.15.0", defaultCode: `// Real-Time Collaborative JavaScript\nfunction welcome() {\n  const message = "Hello from SyncSpace!";\n  console.log(message);\n}\n\nwelcome();\n` },
    { id: "python", label: "Python 3", version: "3.10.0", defaultCode: `# Real-Time Collaborative Python\ndef welcome():\n    message = "Hello from SyncSpace!"\n    print(message)\n\nwelcome()\n` },
    { id: "cpp", label: "C++ (GCC)", version: "10.2.0", defaultCode: `// Real-Time Collaborative C++\n#include <iostream>\n\nint main() {\n    std::cout << "Hello from SyncSpace!" << std::endl;\n    return 0;\n}\n` },
    { id: "java", label: "Java", version: "15.0.2", defaultCode: `// Real-Time Collaborative Java\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from SyncSpace!");\n    }\n}\n` },
    { id: "go", label: "Go", version: "1.16.2", defaultCode: `// Real-Time Collaborative Go\npackage main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello from SyncSpace!")\n}\n` },
    { id: "rust", label: "Rust", version: "1.68.2", defaultCode: `// Real-Time Collaborative Rust\nfn main() {\n    println!("Hello from SyncSpace!");\n}\n` },
    { id: "typescript", label: "TypeScript", version: "5.0.3", defaultCode: `// Real-Time Collaborative TypeScript\nconst welcome = (name: string): string => {\n  return \`Hello, \${name} from SyncSpace!\`;\n};\n\nconsole.log(welcome("Developer"));\n` },
    { id: "csharp", label: "C#", version: "6.12.0", defaultCode: `// Real-Time Collaborative C#\nusing System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello from SyncSpace!");\n    }\n}\n` },
    { id: "php", label: "PHP", version: "8.2.3", defaultCode: `<?php\n// Real-Time Collaborative PHP\necho "Hello from SyncSpace!\\n";\n` },
    { id: "html", label: "HTML5", version: "5", defaultCode: `<!DOCTYPE html>\n<html>\n<head>\n  <title>SyncSpace Preview</title>\n</head>\n<body>\n  <h1>Hello from SyncSpace!</h1>\n</body>\n</html>\n` }
];

const CodeEditor = ({ roomId, socket }) => {
    const [language, setLanguage] = useState("javascript");
    const [code, setCode] = useState(LANGUAGES[0].defaultCode);
    const [theme, setTheme] = useState("vs-dark");
    const [copied, setCopied] = useState(false);

    // Code execution state
    const [isRunning, setIsRunning] = useState(false);
    const [output, setOutput] = useState(null);
    const [showTerminal, setShowTerminal] = useState(false);

    const isRemoteChange = useRef(false);
    const editorRef = useRef(null);

    const handleEditorDidMount = (editor) => {
        editorRef.current = editor;
        editor.focus();
    };

    // Request initial code state when joined
    useEffect(() => {
        if (!socket || !roomId) return;

        socket.emit("sync-code", { roomId });

        const handleSyncCode = ({ code: syncedCode, language: syncedLang }) => {
            if (syncedCode !== undefined) {
                isRemoteChange.current = true;
                setCode(syncedCode);
            }
            if (syncedLang !== undefined) {
                setLanguage(syncedLang);
            }
        };

        const handleCodeChange = ({ code: incomingCode }) => {
            isRemoteChange.current = true;
            setCode(incomingCode);
        };

        const handleLanguageChange = ({ language: incomingLang, code: incomingCode }) => {
            setLanguage(incomingLang);
            if (incomingCode !== undefined) {
                isRemoteChange.current = true;
                setCode(incomingCode);
            }
        };

        socket.on("sync-code", handleSyncCode);
        socket.on("code-change", handleCodeChange);
        socket.on("language-change", handleLanguageChange);

        return () => {
            socket.off("sync-code", handleSyncCode);
            socket.off("code-change", handleCodeChange);
            socket.off("language-change", handleLanguageChange);
        };
    }, [socket, roomId]);

    // Handle code editing
    const handleCodeChange = (newCode) => {
        if (isRemoteChange.current) {
            isRemoteChange.current = false;
            return;
        }

        const updatedCode = newCode || "";
        setCode(updatedCode);

        if (socket && roomId) {
            socket.emit("code-change", {
                roomId,
                code: updatedCode
            });
        }
    };

    // Handle language change
    const handleLanguageSelect = (e) => {
        const newLangId = e.target.value;
        const selectedLangObj = LANGUAGES.find((l) => l.id === newLangId);
        const newCode = selectedLangObj ? selectedLangObj.defaultCode : "";

        setLanguage(newLangId);
        setCode(newCode);

        if (socket && roomId) {
            socket.emit("language-change", {
                roomId,
                language: newLangId,
                code: newCode
            });
        }
    };

    // Execute code using Piston API
    const runCode = async () => {
        const langConfig = LANGUAGES.find((l) => l.id === language);
        if (!langConfig) return;

        setIsRunning(true);
        setShowTerminal(true);
        setOutput({ status: "running", text: "Compiling and running code..." });

        try {
            const response = await axios.post("https://emkc.org/api/v2/piston/execute", {
                language: langConfig.id,
                version: langConfig.version,
                files: [
                    {
                        content: code
                    }
                ]
            });

            const result = response.data;
            const runInfo = result.run || {};
            const compileInfo = result.compile || {};

            let stdout = runInfo.stdout || "";
            let stderr = runInfo.stderr || compileInfo.stderr || "";

            if (!stdout && !stderr) {
                stdout = "Program executed successfully with no output.";
            }

            setOutput({
                status: stderr ? "error" : "success",
                stdout,
                stderr,
                code: runInfo.code
            });
        } catch (err) {
            setOutput({
                status: "error",
                stderr: err.response?.data?.message || err.message || "Failed to reach execution engine."
            });
        } finally {
            setIsRunning(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const resetCode = () => {
        const langConfig = LANGUAGES.find((l) => l.id === language);
        if (langConfig) {
            const defaultCode = langConfig.defaultCode;
            setCode(defaultCode);
            if (socket && roomId) {
                socket.emit("code-change", { roomId, code: defaultCode });
            }
        }
    };

    return (
        <div className="code-editor-container">
            {/* Header / Toolbar */}
            <div className="editor-toolbar">
                <div className="toolbar-left">
                    <div className="language-selector-wrapper">
                        <Code className="icon-small" />
                        <select
                            value={language}
                            onChange={handleLanguageSelect}
                            className="language-select"
                        >
                            {LANGUAGES.map((lang) => (
                                <option key={lang.id} value={lang.id}>
                                    {lang.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        className="theme-toggle-btn"
                        onClick={() => setTheme(theme === "vs-dark" ? "light" : "vs-dark")}
                        title="Toggle Editor Theme"
                    >
                        {theme === "vs-dark" ? <Sun className="icon-small" /> : <Moon className="icon-small" />}
                    </button>
                </div>

                <div className="toolbar-right">
                    <button onClick={resetCode} className="icon-button" title="Reset Code Template">
                        <RotateCcw className="icon-small" />
                    </button>

                    <button onClick={copyToClipboard} className="icon-button" title="Copy Code">
                        {copied ? <Check className="icon-small text-green" /> : <Copy className="icon-small" />}
                    </button>

                    <button
                        onClick={runCode}
                        disabled={isRunning}
                        className={`run-button ${isRunning ? "running" : ""}`}
                    >
                        <Play className="icon-small fill-current" />
                        <span>{isRunning ? "Running..." : "Run Code"}</span>
                    </button>
                </div>
            </div>

            {/* Monaco Editor Instance */}
            <div className="editor-wrapper">
                <Editor
                    height="100%"
                    language={language === "cpp" ? "cpp" : language === "csharp" ? "csharp" : language}
                    value={code}
                    theme={theme}
                    onChange={handleCodeChange}
                    onMount={handleEditorDidMount}
                    options={{
                        fontSize: 14,
                        fontFamily: "'Fira Code', 'Consolas', monospace",
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
                        wordWrap: "on",
                        padding: { top: 12, bottom: 12 },
                        smoothScrolling: true,
                        cursorBlinking: "smooth"
                    }}
                />
            </div>

            {/* Terminal / Output Console Panel */}
            <div className={`terminal-panel ${showTerminal ? "open" : "collapsed"}`}>
                <div className="terminal-header" onClick={() => setShowTerminal(!showTerminal)}>
                    <div className="terminal-title">
                        <Terminal className="icon-small" />
                        <span>Console Output</span>
                        {output && output.status === "error" && <span className="status-badge error">Error</span>}
                        {output && output.status === "success" && <span className="status-badge success">Success</span>}
                    </div>

                    <div className="terminal-actions">
                        <button
                            className="terminal-toggle-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowTerminal(!showTerminal);
                            }}
                        >
                            {showTerminal ? <ChevronDown className="icon-small" /> : <ChevronUp className="icon-small" />}
                        </button>
                    </div>
                </div>

                {showTerminal && (
                    <div className="terminal-body">
                        {!output && <div className="terminal-placeholder">Click "Run Code" to view execution results...</div>}

                        {output && output.status === "running" && (
                            <div className="terminal-running">{output.text}</div>
                        )}

                        {output && output.status !== "running" && (
                            <div className="terminal-content">
                                {output.stdout && (
                                    <pre className="output-stdout">{output.stdout}</pre>
                                )}
                                {output.stderr && (
                                    <pre className="output-stderr">{output.stderr}</pre>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CodeEditor;
