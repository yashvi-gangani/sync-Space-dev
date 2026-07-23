import { useEffect, useState, useRef } from "react";
import Editor from "@monaco-editor/react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";
import API from "../../services/api";
import { Play, Code, Copy, RotateCcw, Trash2, Terminal, ChevronDown, ChevronUp, Check } from "lucide-react";
import "./CodeEditor.css";

const LANGUAGES = [
    { id: "javascript", label: "JavaScript", version: "18.15.0" },
    { id: "python", label: "Python 3", version: "3.10.0" },
    { id: "cpp", label: "C++ (GCC)", version: "10.2.0" },
    { id: "java", label: "Java", version: "15.0.2" },
    { id: "go", label: "Go", version: "1.16.2" }
];

const CodeEditor = ({ roomId }) => {
    const [language, setLanguage] = useState("javascript");
    const [theme, setTheme] = useState("vs-dark");
    const [isRunning, setIsRunning] = useState(false);
    const [output, setOutput] = useState(null);
    const [copied, setCopied] = useState(false);
    const [showConsole, setShowConsole] = useState(true);

    const editorRef = useRef(null);
    const providerRef = useRef(null);
    const bindingRef = useRef(null);

    // Initialize Yjs and bind to Monaco Editor
    const handleEditorDidMount = (editor) => {
        editorRef.current = editor;

        // 1. Create a shared Yjs Document
        const doc = new Y.Doc();

        // 2. Connect to a WebSocket Provider (Sync Server)
        const provider = new WebsocketProvider(
            "wss://demos.yjs.dev", // Public testing room sync server
            `syncspace-room-${roomId}`,
            doc
        );

        // 3. Retrieve a shared text field from the Yjs Doc
        const type = doc.getText("monaco");

        // 4. Bind Monaco text structure with the shared text field
        const binding = new MonacoBinding(
            type,
            editor.getModel(),
            new Set([editor]),
            provider.awareness
        );

        providerRef.current = provider;
        bindingRef.current = binding;
    };

    // Clean up Yjs websocket on unmount
    useEffect(() => {
        return () => {
            if (bindingRef.current) bindingRef.current.destroy();
            if (providerRef.current) providerRef.current.destroy();
        };
    }, []);

    // Run Code using the free Piston sandbox engine
    const runCode = async () => {
        const activeLang = LANGUAGES.find((l) => l.id === language);
        if (!activeLang || !editorRef.current) return;

        const codeContent = editorRef.current.getValue();

        setIsRunning(true);
        setShowConsole(true);
        setOutput({ status: "running", stdout: "Running your code..." });

        try {
            const response = await API.post("/execute", {
                language: activeLang.id,
                code: codeContent
            });

            const { run } = response.data;
            setOutput({
                status: run.stderr ? "error" : "success",
                stdout: run.stdout,
                stderr: run.stderr
            });
        } catch (err) {
            setOutput({
                status: "error",
                stderr: "Execution request failed."
            });
        } finally {
            setIsRunning(false);
        }
    };

    // Copy code to clipboard
    const handleCopy = () => {
        if (!editorRef.current) return;
        const codeContent = editorRef.current.getValue();
        navigator.clipboard.writeText(codeContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Reset code to empty/default state
    const handleReset = () => {
        if (!editorRef.current) return;
        editorRef.current.setValue("");
    };

    // Clear console output
    const handleClearConsole = () => {
        setOutput(null);
    };

    return (
        <div className="code-editor-container">
            {/* Toolbar */}
            <div className="editor-toolbar">
                <div className="toolbar-left">
                    <div className="tool-select-wrapper">
                        <Code size={16} className="tool-select-icon" />
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="language-select"
                        >
                            {LANGUAGES.map((lang) => (
                                <option key={lang.id} value={lang.id}>
                                    {lang.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="toolbar-right">
                    <button onClick={handleReset} className="icon-btn" title="Reset Code">
                        <RotateCcw size={16} />
                    </button>
                    <button onClick={handleCopy} className="icon-btn" title="Copy Code">
                        {copied ? <Check size={16} className="text-green" /> : <Copy size={16} />}
                    </button>
                    <button onClick={runCode} disabled={isRunning} className="run-btn">
                        <Play size={15} fill="currentColor" />
                        <span>{isRunning ? "Running..." : "Run Code"}</span>
                    </button>
                </div>
            </div>

            {/* Monaco Editor Wrapper */}
            <div className="editor-wrapper">
                <Editor
                    height="100%"
                    language={language}
                    theme={theme}
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

            {/* Terminal Panel */}
            <div className={`console-panel ${showConsole ? "expanded" : "collapsed"}`}>
                <div className="console-header" onClick={() => setShowConsole(!showConsole)}>
                    <div className="console-title">
                        <Terminal size={15} />
                        <span>Console Output</span>
                        {output && output.status === "error" && <span className="badge badge-error">Error</span>}
                        {output && output.status === "success" && <span className="badge badge-success">Success</span>}
                    </div>
                    <div className="console-actions">
                        {output && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleClearConsole();
                                }}
                                className="console-action-btn"
                                title="Clear Console"
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                        <button className="console-action-btn">
                            {showConsole ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                        </button>
                    </div>
                </div>
                {showConsole && (
                    <div className="console-body">
                        {!output && <span className="console-placeholder">Click "Run Code" to view results...</span>}
                        {output && (
                            <>
                                {output.stdout && <pre className="output-stdout">{output.stdout}</pre>}
                                {output.stderr && <pre className="output-stderr">{output.stderr}</pre>}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CodeEditor;