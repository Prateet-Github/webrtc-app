import { useSocket } from "../providers/Socket";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [userId, setUserId] = useState("");
  const [roomId, setRoomId] = useState("");

  const handleRoomJoined = useCallback(
    (roomId) => {
      console.log(`Successfully joined room: ${roomId}`);
      navigate(`/room/${roomId}`);
    },
    [navigate]
  );

  useEffect(() => {
    socket.on("joined-room", handleRoomJoined);
    return () => {
      socket.off("joined-room", handleRoomJoined);
    };
  }, [socket, handleRoomJoined]);

  const handleJoinRoom = () => {
    socket.emit("join-room", { roomId, userId });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white space-y-4">
      <input
        type="email"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        placeholder="Enter your email"
        className="px-4 py-2 border border-gray-300 rounded-lg w-72 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <input
        type="text"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        placeholder="Enter room code"
        className="px-4 py-2 border border-gray-300 rounded-lg w-72 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <input
        type="button"
        onClick={handleJoinRoom}
        value="Enter Room"
        className="px-4 py-2 bg-blue-500 text-white rounded-lg w-72 hover:bg-blue-600 cursor-pointer"
      />
    </div>
  );
};

export default Home;
