import { useSocket } from "../providers/Socket";
import { useCallback, useEffect } from "react";
import { usePeer } from "../providers/Peer";
import { useState } from "react";

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

  const handleNewUserJoined = useCallback(
    async (data) => {
      const { userId } = data;
      console.log("New user joined:", userId);

      // Send stream before creating offer if available
      if (myStream) {
        console.log("Sending stream before creating offer");
        sendStream(myStream);
      }

      const offer = await createOffer();
      socket.emit("call-user", { offer, userId });
    },
    [createOffer, socket, myStream, sendStream]
  );

  const handleIncomingCall = useCallback(
    async (data) => {
      const { from, offer } = data;
      console.log("Incoming call from", from, offer);

      // Send stream before creating answer if available
      if (myStream) {
        console.log("Sending stream before creating answer");
        sendStream(myStream);
      }

      const answer = await createAnswer(offer);
      socket.emit("call-accepted", { answer, from });
    },
    [createAnswer, socket, myStream, sendStream]
  );

  const handleCallAccepted = useCallback(
    async (data) => {
      const { answer } = data;
      console.log("Call accepted with answer:", answer);
      await setRemoteAnswer(answer);
    },
    [setRemoteAnswer]
  );

  // 🔥 NEW: Handle ICE candidates
  const handleIceCandidate = useCallback(
    async (data) => {
      const { candidate } = data;
      console.log("Received ICE candidate:", candidate);
      try {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
        console.log("ICE candidate added successfully");
      } catch (error) {
        console.error("Error adding ICE candidate:", error);
      }
    },
    [peer]
  );

  const getUserMediaStream = useCallback(async () => {
    try {
      console.log("Requesting camera access...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      console.log("Camera access granted:", stream);
      setMyStream(stream);
    } catch (error) {
      console.error("Camera access failed:", error.name, error.message);
    }
  }, []);

  // 🔥 NEW: Setup ICE candidate handling
  useEffect(() => {
    const handleIceCandidateEvent = (event) => {
      if (event.candidate) {
        console.log("Sending ICE candidate:", event.candidate);
        socket.emit("ice-candidate", { candidate: event.candidate });
      } else {
        console.log("All ICE candidates have been sent");
      }
    };

    peer.addEventListener("icecandidate", handleIceCandidateEvent);

    return () => {
      peer.removeEventListener("icecandidate", handleIceCandidateEvent);
    };
  }, [peer, socket]);

  // 🔥 NEW: Join room when component mounts
  useEffect(() => {
    const roomId = "room1"; // You can get this from URL params later
    const userId = `user-${Date.now()}@example.com`; // Generate unique user ID
    
    console.log(`🏠 Joining room: ${roomId} as user: ${userId}`);
    socket.emit("join-room", { roomId, userId });
    
    // Listen for successful room join
    socket.on("joined-room", (joinedRoomId) => {
      console.log(`✅ Successfully joined room: ${joinedRoomId}`);
    });
    
    return () => {
      socket.off("joined-room");
    };
  }, [socket]);

  useEffect(() => {
    console.log("Setting up socket listeners...");
    console.log("Socket connected:", socket.connected);
    
    socket.on("user-joined", handleNewUserJoined);
    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-accepted", handleCallAccepted);
    socket.on("ice-candidate", handleIceCandidate); // 🔥 NEW

    return () => {
      console.log("Cleaning up socket listeners...");
      socket.off("user-joined", handleNewUserJoined);
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-accepted", handleCallAccepted);
      socket.off("ice-candidate", handleIceCandidate); // 🔥 NEW
    };
  }, [handleNewUserJoined, handleIncomingCall, handleCallAccepted, handleIceCandidate, socket]);

  // 🔥 NEW: Join room when component mounts
  useEffect(() => {
    const roomId = window.location.pathname.split('/').pop() || 'default-room';
    const userId = `user-${Date.now()}@example.com`; // Generate unique user ID
    
    console.log(`🏠 Joining room: ${roomId} as user: ${userId}`);
    socket.emit("join-room", { roomId, userId });
    
    // Listen for successful room join
    socket.on("joined-room", (joinedRoomId) => {
      console.log(`✅ Successfully joined room: ${joinedRoomId}`);
    });
    
    return () => {
      socket.off("joined-room");
    };
  }, [socket]);

  useEffect(() => {
    getUserMediaStream();
  }, [getUserMediaStream]);

  useEffect(() => {
    console.log("myStream updated:", myStream);
  }, [myStream]);

  useEffect(() => {
    console.log("Remote stream in Room component:", remoteStream);
  }, [remoteStream]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <button onClick={(e) => sendStream(myStream)}>Send My video</button>

      <div>
        <div>My Video:</div>
        {myStream && (
          <video
            ref={(video) => {
              if (video) video.srcObject = myStream;
            }}
            autoPlay
            muted
            width="400"
            height="300"
            style={{ border: "2px solid blue" }}
          />
        )}
      </div>

      <div>
        <div>Remote Video:</div>
        {remoteStream && (
          <video
            ref={(video) => {
              if (video) video.srcObject = remoteStream;
            }}
            autoPlay
            width="400"
            height="300"
            style={{ border: "2px solid red" }}
          />
        )}
      </div>
    </div>
  );
};

export default Room;