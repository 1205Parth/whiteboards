import React, { useEffect, useRef, useState } from 'react';

const DrawingCanvas = ({ color, strokeWidth, socket, roomId, username, remoteCursors }) => {
    const canvasRef = useRef(null);
    const [drawing, setDrawing] = useState(false);
    const lastPoint = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight - 150;
        const ctx = canvas.getContext('2d');
        ctx.lineCap = 'round';

        if (socket) {
            socket.on('draw', (data) => {
                const ctx = canvas.getContext('2d');
                ctx.strokeStyle = data.color;
                ctx.lineWidth = data.strokeWidth;
                ctx.beginPath();
                ctx.moveTo(data.fromX, data.fromY);
                ctx.lineTo(data.toX, data.toY);
                ctx.stroke();
            });

            socket.on('clear-canvas', () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            });

            socket.on('load-drawing', (drawingData) => {
                drawingData.forEach(cmd => {
                    if (cmd.type === 'stroke') {
                        const { fromX, fromY, toX, toY, color, strokeWidth } = cmd.data;
                        ctx.strokeStyle = color;
                        ctx.lineWidth = strokeWidth;
                        ctx.beginPath();
                        ctx.moveTo(fromX, fromY);
                        ctx.lineTo(toX, toY);
                        ctx.stroke();
                    } else if (cmd.type === 'clear') {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                    }
                });
            });
        }

        return () => {
            if (socket) {
                socket.off('draw');
                socket.off('clear-canvas');
                socket.off('load-drawing');
            }
        };
    }, [socket]);

    const getCoordinates = (e) => ({
        x: e.nativeEvent.offsetX,
        y: e.nativeEvent.offsetY
    });

    const startDrawing = (e) => {
        setDrawing(true);
        const { x, y } = getCoordinates(e);
        lastPoint.current = { x, y };
    };

    const draw = (e) => {
        if (!drawing) return;
        const ctx = canvasRef.current.getContext('2d');
        const { x, y } = getCoordinates(e);

        ctx.strokeStyle = color;
        ctx.lineWidth = strokeWidth;
        ctx.beginPath();
        ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
        ctx.lineTo(x, y);
        ctx.stroke();

        socket.emit('draw', {
            roomId,
            fromX: lastPoint.current.x,
            fromY: lastPoint.current.y,
            toX: x,
            toY: y,
            color,
            strokeWidth
        });

        lastPoint.current = { x, y };
    };

    const stopDrawing = () => {
        setDrawing(false);
    };

    const handleMouseMove = (e) => {
        const { x, y } = getCoordinates(e);
        socket.emit('cursor-move', { roomId, x, y, username });
    };

    return (
        <div style={{ position: 'relative' }}>
            <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={(e) => {
                    draw(e);
                    handleMouseMove(e);
                }}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                style={{
                    border: '1px solid #ccc',
                    display: 'block',
                    margin: 'auto',
                    cursor: 'crosshair',
                    position: 'relative'
                }}
            />
            {/* Render remote cursors */}
            {Object.entries(remoteCursors).map(([id, { x, y, username }]) => (
                <div
                    key={id}
                    style={{
                        position: 'absolute',
                        left: x,
                        top: y,
                        pointerEvents: 'none',
                        transform: 'translate(-50%, -50%)',
                        background: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        zIndex: 99
                    }}
                >
                    🖱️ {username}
                </div>
            ))}
        </div>
    );
};

export default DrawingCanvas;
