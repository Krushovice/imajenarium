import { apiClient } from "./client";

// ── Literary DNA ────────────────────────────────────────────────────────────

export interface LiteraryDNAOut {
  id: string;
  user_id: string;
  metrics: Record<string, number>;
  version: number;
  last_computed_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function fetchMyDNA(): Promise<LiteraryDNAOut> {
  const res = await apiClient.get<LiteraryDNAOut>("/literary-dna/me");
  return res.data;
}

// ── Books / Shelf ───────────────────────────────────────────────────────────

export interface BookSearchResult {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  description: string | null;
  published_year: number | null;
  emotional_tags: string[];
  ai_summary: string | null;
}

export interface UserBookOut {
  id: string;
  user_id: string;
  book_id: string;
  book: BookSearchResult | null;
  status: "want_to_read" | "reading" | "read" | "abandoned";
  rating: number | null;
  review: string | null;
  quotes: string[];
  started_at: string | null;
  finished_at: string | null;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserLibraryResponse {
  items: UserBookOut[];
  total: number;
  offset: number;
  limit: number;
}

export async function fetchMyShelf(status?: string): Promise<UserLibraryResponse> {
  const params: Record<string, string | number> = { limit: 100 };
  if (status) params.status = status;
  const res = await apiClient.get<UserLibraryResponse>("/books/shelf/me", { params });
  return res.data;
}

// ── Reading Diary ───────────────────────────────────────────────────────────

export interface DiaryEntryOut {
  id: string;
  user_id: string;
  book_id: string | null;
  content: string;
  mood: string | null;
  emotion_tags: string[];
  quotes: string[];
  ai_emotional_analysis: Record<string, unknown> | null;
  dna_impact_applied: boolean;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

export interface DiaryListResponse {
  items: DiaryEntryOut[];
  total: number;
  offset: number;
  limit: number;
}

export async function fetchMyDiary(limit = 20): Promise<DiaryListResponse> {
  const res = await apiClient.get<DiaryListResponse>("/diary", { params: { limit } });
  return res.data;
}

// ── Recommendations ─────────────────────────────────────────────────────────

export interface RecommendationOut {
  id: string;
  book_id: string;
  book: BookSearchResult | null;
  score: number;
  source: string;
  ai_explanation: string | null;
  seen: boolean;
  clicked: boolean;
  dismissed: boolean;
  expires_at: string | null;
  created_at: string;
}

export interface RecommendationListResponse {
  items: RecommendationOut[];
  total: number;
}

export async function fetchMyRecommendations(limit = 20): Promise<RecommendationListResponse> {
  const res = await apiClient.get<RecommendationListResponse>("/recommendations", {
    params: { limit },
  });
  return res.data;
}

export interface EphemeralRecommendation {
  title: string;
  author: string;
  book_id: string | null;
  book: BookSearchResult | null;
  explanation: string;
  dominant_emotion: string | null;
  atmosphere: string | null;
  score: number;
}

export interface EphemeralListResponse {
  items: EphemeralRecommendation[];
}

export async function fetchPromptRecommendations(
  prompt: string,
  count = 6
): Promise<EphemeralListResponse> {
  const res = await apiClient.post<EphemeralListResponse>("/recommendations/ai-prompt", {
    prompt,
    count,
  });
  return res.data;
}

// ── News Feed ───────────────────────────────────────────────────────────────

export interface NewsFeedItemOut {
  id: string;
  source_name: string;
  title: string;
  url: string;
  author: string | null;
  published_at: string | null;
  ai_summary: string | null;
  emotional_tags: string[];
  mood: string | null;
  atmosphere: string | null;
  created_at: string;
}

export interface NewsFeedResponse {
  items: NewsFeedItemOut[];
  total: number;
  personalized: boolean;
}

export async function fetchNewsFeed(limit = 20): Promise<NewsFeedResponse> {
  const res = await apiClient.get<NewsFeedResponse>("/news-feed", { params: { limit } });
  return res.data;
}

// ── Social ──────────────────────────────────────────────────────────────────

export interface FriendOut {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

export interface FriendWithCompatibility {
  friend: FriendOut;
  friendship_id: string;
  compatibility_score: number | null;
  friendship_since: string;
}

export interface FriendListResponse {
  items: FriendWithCompatibility[];
  total: number;
}

export async function fetchFriends(): Promise<FriendListResponse> {
  const res = await apiClient.get<FriendListResponse>("/social/friends");
  return res.data;
}

export interface PendingRequestOut {
  friendship_id: string;
  requester: FriendOut;
  created_at: string;
}

export interface PendingRequestsResponse {
  items: PendingRequestOut[];
  total: number;
}

export async function fetchPendingRequests(): Promise<PendingRequestsResponse> {
  const res = await apiClient.get<PendingRequestsResponse>("/social/friends/pending");
  return res.data;
}

export async function acceptFriendRequest(friendshipId: string): Promise<void> {
  await apiClient.post(`/social/friends/${friendshipId}/accept`);
}

export async function declineFriendRequest(friendshipId: string): Promise<void> {
  await apiClient.delete(`/social/friends/${friendshipId}`);
}

// ── Book Catalog ─────────────────────────────────────────────────────────────

export interface BookOut {
  id: string;
  title: string;
  author: string;
  isbn: string | null;
  cover_url: string | null;
  description: string | null;
  published_year: number | null;
  language: string;
  page_count: number | null;
  emotional_tags: string[];
  ai_summary: string | null;
  goodreads_id: string | null;
  openlibrary_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserBookCreateInput {
  status: string;
  rating?: number;
  review?: string;
  quotes?: string[];
  is_private?: boolean;
}

export interface UserBookUpdateInput {
  status?: string;
  rating?: number;
  review?: string;
  quotes?: string[];
  is_private?: boolean;
}

export async function fetchCatalog(offset = 0, limit = 50): Promise<BookSearchResult[]> {
  const res = await apiClient.get<BookSearchResult[]>("/books", { params: { offset, limit } });
  return res.data;
}

export async function textSearchBooks(q: string, limit = 20): Promise<BookSearchResult[]> {
  const res = await apiClient.get<BookSearchResult[]>("/books/search/text", { params: { q, limit } });
  return res.data;
}

export async function semanticSearchBooks(text: string, limit = 20): Promise<BookSearchResult[]> {
  const res = await apiClient.post<BookSearchResult[]>("/books/search/semantic", { text, limit });
  return res.data;
}

export async function getBook(bookId: string): Promise<BookOut> {
  const res = await apiClient.get<BookOut>(`/books/${bookId}`);
  return res.data;
}

export async function getShelfEntry(bookId: string): Promise<UserBookOut> {
  const res = await apiClient.get<UserBookOut>(`/books/${bookId}/shelf`);
  return res.data;
}

export async function addToShelf(bookId: string, data: UserBookCreateInput): Promise<UserBookOut> {
  const res = await apiClient.post<UserBookOut>(`/books/${bookId}/shelf`, data);
  return res.data;
}

export async function updateShelfEntry(bookId: string, data: UserBookUpdateInput): Promise<UserBookOut> {
  const res = await apiClient.patch<UserBookOut>(`/books/${bookId}/shelf`, data);
  return res.data;
}

export async function removeFromShelf(bookId: string): Promise<void> {
  await apiClient.delete(`/books/${bookId}/shelf`);
}
