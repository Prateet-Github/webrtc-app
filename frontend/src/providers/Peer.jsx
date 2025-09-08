import {
  createContext,
  useMemo,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

const PeerContext = createContext(null);

export const usePeer = () => {
  return useContext(PeerContext);
};

export const PeerProvider = (props) => {
  const [remoteStream, setRemoteStream] = useState(null);
  const peer = useMemo(
    () =>
      new RTCPeerConnection({
        iceServers: [
          {
            urls: [
              "stun:stun.l.google.com:19302",
              "stun:global.stun.twilio.com:3478",
            ],
          },
        ],
      }),
    []
  );

  const createOffer = async () => {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    return offer;
  };

  const createAnswer = async (offer) => {
    await peer.setRemoteDescription(offer);
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    return answer;
  };

  const setRemoteAnswer = async (answer) => {
    await peer.setRemoteDescription(new RTCSessionDescription(answer));
  };

  const sendStream = async (stream) => {
    const existingSenders = peer.getSenders();

    stream.getTracks().forEach((track) => {
      const trackAlreadyAdded = existingSenders.some(
        (sender) => sender.track && sender.track.id === track.id
      );

      if (!trackAlreadyAdded) {
        peer.addTrack(track, stream);
      } else {
        console.log("Track already added:", track.kind);
      }
    });
  };

  const handleTrackvent = useCallback((event) => {
    console.log("🎥 Track event received:", event);
    console.log("📺 Event streams:", event.streams);
    const streams = event.streams;
    console.log("Setting remote stream:", streams[0]);
    setRemoteStream(streams[0]);
  }, []);

  // Single useEffect to handle all peer events
  useEffect(() => {
    const handleConnectionStateChange = () => {
      console.log("Connection state:", peer.connectionState);
      console.log("ICE connection state:", peer.iceConnectionState);
    };

    // Log initial states
    console.log("Initial peer connection state:", peer.connectionState);
    console.log("Initial ICE connection state:", peer.iceConnectionState);

    // Add all event listeners
    peer.addEventListener("connectionstatechange", handleConnectionStateChange);
    peer.addEventListener("iceconnectionstatechange", handleConnectionStateChange);
    peer.addEventListener("track", handleTrackvent);

    return () => {
      peer.removeEventListener("connectionstatechange", handleConnectionStateChange);
      peer.removeEventListener("iceconnectionstatechange", handleConnectionStateChange);
      peer.removeEventListener("track", handleTrackvent);
    };
  }, [peer, handleTrackvent]);

  return (
    <PeerContext.Provider
      value={{
        peer,
        createOffer,
        createAnswer,
        setRemoteAnswer,
        sendStream,
        remoteStream,
      }}
    >
      {props.children}
    </PeerContext.Provider>
  );
};