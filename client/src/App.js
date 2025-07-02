import React, { useState } from 'react';
import RoomJoin from './components/RoomJoin';
import Whiteboard from './components/Whiteboard';

function App() {
  const [roomId, setRoomId] = useState(null);
  const [username, setUsername] = useState('');

  const handleJoin = (roomCode, name) => {
    setRoomId(roomCode);
    setUsername(name);
  };

  return (
    <div>
      {roomId ? (
        <Whiteboard roomId={roomId} username={username} />
      ) : (
        <RoomJoin onJoin={handleJoin} />
      )}
    </div>
  );
}

export default App;
