export type User = {
  id: number
  handle: string
  displayName: string
  avatarUrl: string | null
}

export type Me = User & {
  email: string
  bio: string
  unreadNotifications: number
}

export type ShowSummary = {
  id: number
  slug: string
  title: string
  coverUrl: string | null
  owner: User
}

export type Show = ShowSummary & {
  description: string
  tags: string[]
  episodeCount: number
  followerCount: number
  following: boolean
  canEdit: boolean
  createdAt: string
}

export type Episode = {
  id: number
  title: string
  description: string
  tags: string[]
  status: 'processing' | 'ready' | 'failed'
  transcriptStatus: 'pending' | 'running' | 'ready' | 'failed'
  audioUrl: string | null
  durationSeconds: number | null
  playCount: number
  likeCount: number
  commentCount: number
  liked: boolean
  bookmarked: boolean
  progressSeconds: number | null
  publishedAt: string | null
  createdAt: string
  canEdit: boolean
  show: ShowSummary
  waveform?: number[]
}

export type Comment = {
  id: number
  parentId: number | null
  atSeconds: number | null
  body: string
  audioUrl: string | null
  audioSeconds: number | null
  createdAt: string
  user: User
  canDelete: boolean
}

export type Segment = { start: number; end: number; text: string }

export type Moment = { episode: Episode; start: number; snippet: string }

export type SearchResults = {
  shows: Show[]
  episodes: Episode[]
  moments: Moment[]
  users: User[]
}

export type Profile = User & {
  bio: string
  followerCount: number
  followingCount: number
  following: boolean
  isMe: boolean
  shows: Show[]
  comments: Comment[]
}

export type Notification = {
  id: number
  kind: 'comment' | 'reply' | 'follow_user' | 'follow_show' | 'like' | 'new_episode'
  actor: User | null
  show: { slug: string; title: string } | null
  episode: { id: number; title: string } | null
  comment: { id: number; body: string; atSeconds: number | null; hasAudio: boolean } | null
  createdAt: string
  read: boolean
}

export type AudioMatch = {
  episode: Episode
  startSeconds: number
  atSeconds: number
  score: number
}
