import React, { useState } from 'react';
import axios from 'axios';

const RoomJoin = ({ onJoin }) => {
    const [roomCode, setRoomCode] = useState('');
    const [username, setUsername] = useState('');

    const generateRoomCode = () => {
        const length = Math.floor(Math.random() * 3) + 6; // 6 to 8 characters
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    const handleJoin = async () => {
        let finalRoomCode = roomCode.trim();

        // Validate or generate room code
        if (!/^[a-zA-Z0-9]{6,8}$/.test(finalRoomCode)) {
            finalRoomCode = generateRoomCode();
            alert(`⚠️ Invalid room code. Generated new code: ${finalRoomCode}`);
        }

        // Validate username
        if (username.trim().length < 2) {
            alert('Please enter a valid username (min 2 characters)');
            return;
        }

        try {
            await axios.post('http://localhost:5000/api/rooms/join', {
                roomId: finalRoomCode
            });

            onJoin(finalRoomCode, username.trim());
        } catch (err) {
            console.error("Failed to join or create room:", err);
            alert("❌ Failed to join or create room.");
        }
    };

    return (
        <div style={styles.container}>
            <h2>Join Whiteboard Room</h2>

            <input
                type="text"
                placeholder="Your Name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={styles.input}
            />
            <br />

            <input
                type="text"
                placeholder="Room Code (6-8 chars)"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                style={styles.input}
            />

            <button onClick={handleJoin} style={styles.button}>
                Join
            </button>
        </div>
    );
};

const styles = {
    container: {
        marginTop: '100px',
        textAlign: 'center'
    },
    input: {
        padding: '10px',
        fontSize: '16px',
        width: '250px',
        marginTop: '10px'
    },
    button: {
        padding: '10px 20px',
        marginTop: '10px',
        fontSize: '16px',
        cursor: 'pointer'
    }
};

export default RoomJoin;
