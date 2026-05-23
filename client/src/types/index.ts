// ─── Shared domain types ──────────────────────────────────────────────────────

export interface Author {
  id: string
  firstName: string
  lastName: string
  avatar: string | null
}

export interface User extends Author {
  email: string
  username?: string
  name?: string
  bio?: string
  dob?: string
  gender?: string
}

export interface PostRecord {
  id: string
  content: string | null
  image: string | null
  video: string | null
  authorId: string
  createdAt: string
  updatedAt: string
  author: Author
  tags?: { user: Author }[]
  _count?: { likes: number; comments: number }
}

export interface Comment {
  id: string
  content: string
  createdAt: string
  author: Author
  replies?: Comment[]
}

export interface StoryRecord {
  id: string
  image: string | null
  text: string | null
  backgroundColor: string
  authorId: string
  createdAt: string
  expiresAt: string
  author: Author
}

export interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (user: User, token: string) => void
  logout: () => void
}
