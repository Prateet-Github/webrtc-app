import { useSocket } from "../providers/Socket";
import { useCallback, useEffect, useState } from "react";
import { usePeer } from "../providers/Peer";

const Room = () => {
  const { socket } = useSocket();
  const {
    peer,
    createOffer,
    createAnswer,
    setRemoteAnswer,
    sendStream,
    remoteStream,
  } = usePeer();

  const [myStream, setMyStream] = useState(null);
  const [userId, setUserId] = useState(null);

  // 🎥 Get camera + mic stream
  const getUserMediaStream = useCallback(async () => {
    try {
      console.log("Requesting camera access...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      console.log("✅ Camera access granted:", stream);
      setMyStream(stream);
    } catch (error) {
      console.error("❌ Camera access failed:", error.name, error.message);
    }
  }, []);

  // 🆕 Handle when new user joins
  const handleNewUserJoined = useCallback(
    async (data) => {
      const { userId: newUserId } = data;
      console.log("👤 New user joined:", newUserId);

      if (myStream) {
        sendStream(myStream);
      }

      const offer = await createOffer();
      socket.emit("call-user", { offer, userId: newUserId });
    },
    [createOffer, socket, myStream, sendStream]
  );

  // 🆕 Handle incoming call
  const handleIncomingCall = useCallback(
    async (data) => {
      const { from, offer } = data;
      console.log("📞 Incoming call from", from);

      if (myStream) {
        sendStream(myStream);
      }

      const answer = await createAnswer(offer);
      socket.emit("call-accepted", { answer, from });
    },
    [createAnswer, socket, myStream, sendStream]
  );

  // 🆕 Handle call accepted (set remote answer)
  const handleCallAccepted = useCallback(
    async (data) => {
      const { answer } = data;
      console.log("✅ Call accepted, setting remote answer");
      await setRemoteAnswer(answer);
    },
    [setRemoteAnswer]
  );

  // 🆕 Handle incoming ICE candidates
  const handleIceCandidate = useCallback(
    async (data) => {
      const { candidate } = data;
      console.log("📩 Received ICE candidate:", candidate);
      try {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
        console.log("✅ ICE candidate added");
      } catch (error) {
        console.error("❌ Error adding ICE candidate:", error);
      }
    },
    [peer]
  );

  // 🛰️ Send ICE candidates to server
  useEffect(() => {
    const handleIceCandidateEvent = (event) => {
      if (event.candidate && userId) {
        console.log("📤 Sending ICE candidate:", event.candidate);
        socket.emit("ice-candidate", {
          candidate: event.candidate,
          from: userId,
        });
      }
    };

    peer.addEventListener("icecandidate", handleIceCandidateEvent);

    return () => {
      peer.removeEventListener("icecandidate", handleIceCandidateEvent);
    };
  }, [peer, socket, userId]);

  // 🏠 Join room once
  useEffect(() => {
    const roomId = window.location.pathname.split("/").pop() || "default-room";
    const newUserId = `user-${Date.now()}@example.com`;
    setUserId(newUserId);

    console.log(`🏠 Joining room: ${roomId} as user: ${newUserId}`);
    socket.emit("join-room", { roomId, userId: newUserId });

    socket.on("joined-room", (joinedRoomId) => {
      console.log(`✅ Successfully joined room: ${joinedRoomId}`);
    });

    return () => {
      socket.off("joined-room");
    };
  }, [socket]);

  // 🎥 Get stream once
  useEffect(() => {
    getUserMediaStream();
  }, [getUserMediaStream]);

  // 🔌 Setup socket listeners
  useEffect(() => {
    console.log("Setting up socket listeners...");

    socket.on("user-joined", handleNewUserJoined);
    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-accepted", handleCallAccepted);
    socket.on("ice-candidate", handleIceCandidate);

    return () => {
      console.log("Cleaning up socket listeners...");
      socket.off("user-joined", handleNewUserJoined);
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-accepted", handleCallAccepted);
      socket.off("ice-candidate", handleIceCandidate);
    };
  }, [
    handleNewUserJoined,
    handleIncomingCall,
    handleCallAccepted,
    handleIceCandidate,
    socket,
  ]);

return (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-indigo-200 p-4">
    {/* Header */}
    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
      📹 WebRTC Video Call
    </h1>

    {/* Video Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl">
      {/* My Video */}
      <div className="bg-white rounded-2xl shadow-lg p-4 flex flex-col items-center">
        <h2 className="text-lg font-semibold text-gray-700 mb-2">
          🎥 My Video
        </h2>
        {myStream ? (
          <video
            ref={(video) => {
              if (video) video.srcObject = myStream;
            }}
            autoPlay
            muted
            playsInline
            className="w-full h-auto rounded-xl border-2 border-blue-500"
          />
        ) : (
          <p className="text-gray-400">No video available</p>
        )}
      </div>

      {/* Remote Video */}
      <div className="bg-white rounded-2xl shadow-lg p-4 flex flex-col items-center">
        <h2 className="text-lg font-semibold text-gray-700 mb-2">
          🌍 Remote Video
        </h2>
        {remoteStream ? (
          <video
            ref={(video) => {
              if (video) video.srcObject = remoteStream;
            }}
            autoPlay
            playsInline
            className="w-full h-auto rounded-xl border-2 border-red-500"
          />
        ) : (
          <p className="text-gray-400">Waiting for remote stream...</p>
        )}
      </div>
    </div>
  </div>
);
};

export default Room;