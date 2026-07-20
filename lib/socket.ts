'use client'

import { io, type Socket } from 'socket.io-client'
import { getToken } from './api'
import type { JoinResult, Member, NowPlaying, ApiTrack, TrackInput } from './api-types'

// Event maps (see API.md §4).
export interface ServerToClient {
  'time:pong': (p: { t0: number; tServer: number }) => void
  'track:start': (current: NowPlaying | null) => void
  'queue:update': (queue: ApiTrack[]) => void
  'members:update': (members: Member[]) => void
  'reaction:broadcast': (p: { emoji: string; nickname: string }) => void
  'room:closed': () => void
}

export interface ClientToServer {
  'time:ping': (p: { t0: number }) => void
  'room:join': (p: { roomId: string }, ack: (r: JoinResult) => void) => void
  'room:leave': () => void
  'queue:add': (p: TrackInput, ack: (r: { ok: boolean; reason?: string }) => void) => void
  'reaction:send': (p: { emoji: string }) => void
}

export type TfmSocket = Socket<ServerToClient, ClientToServer>

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
