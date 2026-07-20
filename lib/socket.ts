'use client'

import { io, type Socket } from 'socket.io-client'
import { getToken } from './api'
import type { ServerToClientEvents, ClientToServerEvents } from './api-types'

export type TfmSocket = Socket<ServerToClientEvents, ClientToServerEvents>

const BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:4000'

let socket: TfmSocket | null = null

/** Lazily create the singleton socket, authenticated with the stored dev token. */
export function getSocket(): TfmSocket {
  if (socket) return socket
  socket = io(BASE, { auth: { token: getToken() }, autoConnect: true })
  return socket
}

export function disconnectSocket() {
  socket?.disconnect()
  socket = null
}
