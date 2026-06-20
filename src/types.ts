export interface TranscriptBlock {
  title: string;
  text: string;
  timeStartStr?: string;
  timeStartSec?: number;
}

export interface VideoResult {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  author: string;
  duration: string;
  transcript: string | string[] | TranscriptBlock[] | null;
  error: string | null;
}

export interface PlaylistResponse {
  playlistTitle: string;
  videos: VideoResult[];
}
