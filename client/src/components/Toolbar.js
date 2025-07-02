import React from 'react';

const Toolbar = ({ color, setColor, strokeWidth, setStrokeWidth, onClear }) => {
    return (
        <div style={styles.toolbar}>
            <label>Color:</label>
            <select value={color} onChange={(e) => setColor(e.target.value)}>
                <option value="black">Black</option>
                <option value="red">Red</option>
                <option value="blue">Blue</option>
                <option value="green">Green</option>
            </select>

            <label>Stroke:</label>
            <input
                type="range"
                min="1"
                max="10"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(e.target.value)}
            />

            <button onClick={onClear}>🧹 Clear</button>
        </div>
    );
};

const styles = {
    toolbar: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px',
        justifyContent: 'center',
    },
};

export default Toolbar;
