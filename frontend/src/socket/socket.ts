import {
  io,
  Socket,
} from "socket.io-client";

let socket: Socket | null = null;

let isConnecting = false;

export function createSocket(
  token: string
) {
  if (!token) return null;

  if (socket) return socket;

  if (isConnecting) return null;

  const url =
    import.meta.env.VITE_SOCKET_URL;

  if (!url) {

    return null;
  }

  isConnecting = true;

  socket = io(url, {
    auth: {
      token,
    },

    transports: ["websocket"],
  });

  socket.on("connect", () => {


    isConnecting = false;
  });

  socket.on("disconnect", () => {

  });

  socket.on(
    "connect_error",
    () => {
      isConnecting = false;
      socket = null;
    }
  );

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}