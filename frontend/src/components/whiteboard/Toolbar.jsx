import "./Whiteboard.css";

const Toolbar = ({
    color,
    setColor,
    brushSize,
    setBrushSize,
    clearCanvas,
}) => {

    return (

        <div className="toolbar">

            <label>Color</label>

            <input
                type="color"
                value={color}
                onChange={(e) =>
                    setColor(e.target.value)
                }
            />

            <label>Brush</label>

            <input
                type="range"
                min="1"
                max="15"
                value={brushSize}
                onChange={(e) =>
                    setBrushSize(Number(e.target.value))
                }
            />

            <button onClick={clearCanvas}>
                Clear
            </button>

        </div>

    );

};

export default Toolbar;