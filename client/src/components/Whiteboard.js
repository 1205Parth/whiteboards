import React, { useEffect, useRef, useState } from 'react';
import DrawingCanvas from './DrawingCanvas';
import Toolbar from './Toolbar';
import { io } from 'socket.io-client';

const Whiteboard = ({ roomId, username }) => {
    const [color, setColor] = useState('black');
    const [strokeWidth, setStrokeWidth] = useState(2);
    const [socketReady, setSocketReady] = useState(false);
    const [userList, setUserList] = useState([]);
    const [cursors, setCursors] = useState({});
    const socketRef = useRef();

    useEffect(() => {
        socketRef.current = io('http://localhost:5000');

        socketRef.current.on('connect', () => {
            socketRef.current.emit('join-room', { roomId, username });
            setSocketReady(true);
        });

        socketRef.current.on('presence-update', (usernames) => {
            setUserList(usernames);
        });

        socketRef.current.on('cursor-update', ({ socketId, x, y, username }) => {
            setCursors(prev => ({
                ...prev,
                [socketId]: { x, y, username }
            }));
        });

        socketRef.current.on('user-disconnected', (socketId) => {
            setCursors(prev => {
                const updated = { ...prev };
                delete updated[socketId];
                return updated;
            });
        });

        return () => {
            socketRef.current.disconnect();
        };
    }, [roomId, username]);

    const handleClear = () => {
        socketRef.current.emit('clear-canvas', roomId);
    };

    return (
        <div>
            <h2 style={{ textAlign: 'center' }}>📝 Room: {roomId}</h2>
            <h4 style={{ textAlign: 'center' }}>👥 Users Online: {userList.length}</h4>
            <ul style={{ listStyle: 'none', textAlign: 'center', padding: 0 }}>
                {userList.map((name, idx) => (
                    <li key={idx} style={{ fontSize: '0.9rem', color: '#555' }}>🔹 {name}</li>
                ))}
            </ul>

            <Toolbar
                color={color}
                setColor={setColor}
                strokeWidth={strokeWidth}
                setStrokeWidth={setStrokeWidth}
                onClear={handleClear}
            />

            {socketReady && (
                <DrawingCanvas
                    color={color}
                    strokeWidth={strokeWidth}
                    socket={socketRef.current}
                    roomId={roomId}
                    username={username}
                    remoteCursors={cursors}
                />
            )}
        </div>
    );
};

export default Whiteboard;
