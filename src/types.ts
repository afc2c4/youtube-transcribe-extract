export interface VideoResult {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  author: string;
  duration: string;
  transcript: string;
  error: string | null;
}

export interface PlaylistResponse {
  playlistTitle: string;
  videos: VideoResult[];
}
