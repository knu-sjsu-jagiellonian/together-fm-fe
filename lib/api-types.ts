/**
 * Backend contract types — a verbatim copy of together-fm-be/shared/types.ts
 * (the single source of truth). Re-copy this file whenever the backend's
 * shared/types.ts changes. Do not hand-edit divergently.
 */

// ---------------------------------------------------------------- 사용자

export interface User {
  id: string;
  username: string;
  nickname: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// ---------------------------------------------------------------- 태그

export type TagId =
  | 'study'
  | 'travel'
  | 'daily'
  | 'party'
  | 'workout'
  | 'chill'
  | 'night'
  | 'drive';

export interface TagMeta {
  id: TagId;
  label: string;
  emoji: string;
}

export const TAGS: readonly TagMeta[] = [
  { id: 'study', label: '공부', emoji: '📚' },
  { id: 'travel', label: '여행', emoji: '✈️' },
  { id: 'daily', label: '일상', emoji: '☕️' },
  { id: 'party', label: '파티', emoji: '🎉' },
  { id: 'workout', label: '운동', emoji: '💪' },
  { id: 'chill', label: '휴식', emoji: '🛋️' },
  { id: 'night', label: '새벽', emoji: '🌌' },
  { id: 'drive', label: '드라이브', emoji: '🚗' },
] as const;

export const TAG_IDS: readonly TagId[] = TAGS.map((t) => t.id);

// ---------------------------------------------------------------- 트랙

/** 큐에 들어간 곡 한 곡. `id`는 큐 아이템 식별자로, 같은 곡을 두 번 넣어도 구분된다. */
export interface Track {
  id: string;
  videoId: string;
  title: string;
  artist: string;
  durationSec: number;
  thumbnail: string;
  addedBy: string;
}

/** YouTube 검색 결과. 아직 큐에 들어가지 않아 `id`/`addedBy`가 없다. */
export interface SearchResult {
  videoId: string;
  title: string;
  artist: string;
  durationSec: number;
  thumbnail: string;
}

/**
 * 곡을 추가할 때 클라이언트가 보내는 입력.
 *
 * 평소에는 `videoId`만 보내면 되고, 서버가 YouTube에서 제목·재생시간을
 * 직접 조회해 채운다. 클라이언트가 보낸 재생시간을 신뢰하면 값이 틀렸을 때
 * 곡 전환 시점이 어긋나 방 전체의 싱크가 깨지기 때문이다.
 *
 * 나머지 필드는 `ALLOW_UNVERIFIED_TRACKS=true`인 개발 모드에서만 쓰인다
 * (API 키 없이 개발할 때). 운영에서는 무시된다.
 */
export interface TrackInput {
  videoId: string;
  title?: string;
  artist?: string;
  durationSec?: number;
  thumbnail?: string;
}

// ---------------------------------------------------------------- 방

export interface RoomMeta {
  id: string;
  title: string;
  tags: TagId[];
  maxMembers: number;
  isPublic: boolean;
  hostNickname: string;
  createdAt: number;
}

/**
 * 재생 중인 곡. 재생 "위치"가 아니라 "언제 0초부터 시작했는지"를 담는다.
 * 위치는 각 클라이언트가 보정된 서버 시각으로 직접 계산한다.
 */
export interface NowPlaying {
  track: Track;
  startedAtServerMs: number;
}

export interface Member {
  /** 소켓 ID. 같은 유저가 두 탭을 열면 서로 다른 값이 된다. */
  id: string;
  userId: string;
  nickname: string;
}

/** 방 목록 카드에 필요한 만큼만 추린 형태. */
export interface RoomCard {
  id: string;
  title: string;
  tags: TagId[];
  memberCount: number;
  maxMembers: number;
  nowPlaying: { title: string; artist: string; thumbnail: string } | null;
}

/** 입장 직후 한 번 내려주는 전체 스냅샷. */
export interface RoomSnapshot {
  room: RoomMeta;
  current: NowPlaying | null;
  queue: Track[];
  members: Member[];
}

/** POST /api/rooms 요청 본문. 방장은 Authorization 토큰으로 식별된다. */
export interface CreateRoomInput {
  title: string;
  tags: TagId[];
  maxMembers: number;
  isPublic: boolean;
  /** 빈 방을 만들 수 없도록 첫 곡은 필수다. */
  firstTrack: TrackInput;
}

// ---------------------------------------------------------------- 아카이브

export interface Archive {
  id: string;
  title: string;
  tags: TagId[];
  playedTracks: Track[];
  participants: string[];
  startedAt: number;
  endedAt: number;
}

// ---------------------------------------------------------------- 소켓 이벤트

export type JoinFailReason = 'not_found' | 'full';

export interface JoinResult {
  ok: boolean;
  /** ok가 false일 때만 채워진다. */
  reason?: JoinFailReason;
  snapshot?: RoomSnapshot;
}

export interface AckResult {
  ok: boolean;
  reason?: string;
}

/** 서버 → 클라이언트 */
export interface ServerToClientEvents {
  'time:pong': (payload: { t0: number; tServer: number }) => void;
  'track:start': (payload: NowPlaying | null) => void;
  'queue:update': (queue: Track[]) => void;
  'members:update': (members: Member[]) => void;
  'reaction:broadcast': (payload: { emoji: string; nickname: string }) => void;
  'room:closed': () => void;
}

/** 클라이언트 → 서버 */
export interface ClientToServerEvents {
  'time:ping': (payload: { t0: number }) => void;
  'room:join': (payload: { roomId: string }, ack: (result: JoinResult) => void) => void;
  'room:leave': () => void;
  'queue:add': (payload: TrackInput, ack: (result: AckResult) => void) => void;
  'reaction:send': (payload: { emoji: string }) => void;
}

// ---------------------------------------------------------------- 상수

export const SYNC = {
  CLOCK_SAMPLES: 5,
  CLOCK_RESYNC_MS: 30_000,
  DRIFT_CHECK_MS: 2_000,
  DRIFT_THRESHOLD_SEC: 1.0,
  TRACK_END_BUFFER_MS: 500,
} as const;

export const ROOM = {
  CLOSE_GRACE_MS: 30_000,
  MAX_QUEUE: 100,
  MIN_MAX_MEMBERS: 2,
  MAX_MAX_MEMBERS: 50,
  MAX_TITLE_LEN: 40,
} as const;

export const REACTION_EMOJIS = ['❤️', '🔥', '🥹', '🕺', '✨', '👏'] as const;

export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

export const MAX_FLOATING_REACTIONS = 30;
