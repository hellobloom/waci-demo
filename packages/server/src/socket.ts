import { FastifyInstance } from "fastify";
import WebSocket from "ws";
import { webSocketCookieKey } from "./cookies";

type WebSocketMap = {
  [userId: string]: WebSocket | undefined;
};

const webSockets: WebSocketMap = {};

export const sendSocketMessage = (message: {
  token: string;
  type: string;
  payload: string;
}) => {
  const socket = webSockets[message.token];

  if (typeof socket === 'undefined') return;

  return new Promise<void>((resolve, reject) => {
    socket.send(JSON.stringify([message.type, message.payload]), err => {
      if (err) reject(err);

      resolve();
    });
  });
};

export const applySocket = (
  app: FastifyInstance,
) => {
  const wss = new WebSocket.Server({
    server: app.server
  });

  wss.on("connection", (ws, req) => {
    if (req.headers.cookie) {
      const webSocketCookie = app.parseCookie(req.headers.cookie)[webSocketCookieKey]

      if (webSocketCookie) {
        const {valid, value} = app.unsignCookie(webSocketCookie)

        if (valid && typeof value === 'string') {
          webSockets[value] = ws;
          return
        }
      }
    }

    ws.close()
  });
};
