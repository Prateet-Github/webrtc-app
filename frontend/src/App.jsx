import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import { SocketProvider } from "./providers/Socket";
import Room from "./pages/Room";
import { PeerProvider } from "./providers/Peer";

const App = () => {
  return (
    <div>
      <SocketProvider>
        <PeerProvider>
          <Routes>
            <Route path="/" element={<Home></Home>} />
            <Route path="/room/:roomId" element={<Room></Room>}></Route>
          </Routes>
        </PeerProvider>
      </SocketProvider>
    </div>
  );
};

export default App;
