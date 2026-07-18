import { useState, useEffect, useRef } from "react";
import { Stage, Layer, Line } from "react-konva";
import Toolbar from "./Toolbar";
import socket from "../../services/socket";
import "./Whiteboard.css";

const Whiteboard = ({ roomId }) => {
    const stageRef = useRef(null);

    const [lines, setLines] = useState([]);
    const [isDrawing, setIsDrawing] = useState(false);

    const [color, setColor] = useState("#000000");
    const [brushSize, setBrushSize] = useState(3);

    // ===========================
    // Start Drawing
    // ===========================
    const handleMouseDown = (e) => {
        setIsDrawing(true);

        const pos = e.target.getStage().getPointerPosition();

        const newLine = {
            points: [pos.x, pos.y],
            color,
            strokeWidth: brushSize,
        };

        setLines((prev) => [...prev, newLine]);
    };

    // ===========================
    // Drawing
    // ===========================
    const handleMouseMove = (e) => {
        if (!isDrawing) return;

        const stage = e.target.getStage();
        const point = stage.getPointerPosition();

        setLines((prevLines) => {
            const lastLineIndex = prevLines.length - 1;

            if (lastLineIndex < 0) return prevLines;

            const updatedLines = [...prevLines];

            const lastLine = {
                ...updatedLines[lastLineIndex],
            };

            lastLine.points = [
                ...lastLine.points,
                point.x,
                point.y,
            ];

            updatedLines[lastLineIndex] = lastLine;

            return updatedLines;
        });
    };

    // ===========================
    // Stop Drawing
    // ===========================
    const handleMouseUp = () => {
        setIsDrawing(false);

        const lastLine = lines[lines.length - 1];

        if (!lastLine) return;

        socket.emit("draw-line", {
            roomId,
            line: lastLine,
        });
    };

    // ===========================
    // Receive Drawing
    // ===========================
    useEffect(() => {
        socket.on("draw-line", (line) => {
            setLines((prev) => [...prev, line]);
        });

        return () => {
            socket.off("draw-line");
        };
    }, []);

    // ===========================
    // Clear Canvas
    // ===========================
    const clearCanvas = () => {
        setLines([]);

        socket.emit("clear-board", roomId);
    };

    // ===========================
    // Receive Clear
    // ===========================
    useEffect(() => {
        socket.on("clear-board", () => {
            setLines([]);
        });

        return () => {
            socket.off("clear-board");
        };
    }, []);

    return (
        <div className="whiteboard-container">

            <Toolbar
                color={color}
                setColor={setColor}
                brushSize={brushSize}
                setBrushSize={setBrushSize}
                clearCanvas={clearCanvas}
            />

            <div className="canvas-wrapper">

                <Stage
                    ref={stageRef}
                    width={900}
                    height={500}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                >

                    <Layer>

                        {lines.map((line, index) => (

                            <Line
                                key={index}
                                points={line.points}
                                stroke={line.color}
                                strokeWidth={line.strokeWidth}
                                tension={0.5}
                                lineCap="round"
                                lineJoin="round"
                            />

                        ))}

                    </Layer>

                </Stage>

            </div>

        </div>
    );
};

export default Whiteboard;