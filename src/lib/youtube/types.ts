export type HttpHeaders = {
  Accept: string;
  Referer: string;
  "User-Agent": string;
  "Sec-Fetch-Mode": string;
  "Accept-Language": string;
};

export type AudioFormat = {
  abr: number | null;
  ext: string;
  tbr: number | null;
  url: string;
  vbr: number;
  format: string;
  vcodec: string;
  has_drm: boolean;
  quality: number;
  language: string;
  protocol: string;
  audio_ext: string;
  format_id: string;
  video_ext: string;
  preference: number | null;
  resolution: string;
  format_note: string;
  aspect_ratio: number | null;
  format_index: number | null;
  http_headers: HttpHeaders;
  manifest_url: string;
  source_preference: number;
};

export type MergedFormat = {
  abr: number | null;
  asr: number;
  ext: string;
  fps: number;
  tbr: number;
  url: string;
  vbr: number | null;
  width: number;
  acodec: string;
  format: string;
  height: number;
  vcodec: string;
  has_drm: boolean;
  quality: number;
  filesize: number;
  language: string;
  protocol: string;
  audio_ext: string;
  format_id: string;
  video_ext: string;
  preference: number | null;
  resolution: string;
  format_note: string;
  aspect_ratio: number;
  http_headers: HttpHeaders;
  dynamic_range: string;
  audio_channels: number;
  filesize_approx: number;
  source_preference: number;
  downloader_options: {
    http_chunk_size: number;
  };
  language_preference: number;
};

export type VideoFormat = {
  abr: number;
  ext: string;
  fps: number;
  tbr: number;
  url: string;
  vbr: number;
  width: number;
  acodec: string;
  format: string;
  height: number;
  vcodec: string;
  has_drm: boolean;
  quality: number;
  protocol: string;
  audio_ext: string;
  format_id: string;
  video_ext: string;
  preference: number | null;
  resolution: string;
  aspect_ratio: number;
  format_index: number | null;
  http_headers: HttpHeaders;
  manifest_url: string;
  dynamic_range: string;
  source_preference: number;
};

export type Thumbnail = {
  id: string;
  url: string;
  preference: number;
};

export type Version = {
  version: string;
  repository: string;
  current_git_head: null | string;
  release_git_head: string;
};

export type CaptionFormat = {
  ext: string;
  url: string;
  name: string;
};

export type LanguageCaptions = CaptionFormat[];

export type AutomaticCaptions = Record<string, LanguageCaptions>;

export type VideoInfo = {
  id: string;
  abr: number;
  asr: number;
  ext: string;
  fps: number;
  tbr: number;
  vbr: number;
  tags: string[];
  _type: string;
  epoch: number;
  title: string;
  width: number;
  acodec: string;
  audios: AudioFormat[];
  format: string;
  height: number;
  merged: MergedFormat[];
  vcodec: string;
  videos: VideoFormat[];
  channel: string;
  formats: any[]; // You might want to define a more specific type for formats if needed
  heatmap: null | any; // Define a more specific type if heatmap data structure is known
  is_live: boolean;
  _has_drm: null | boolean;
  _version: Version;
  chapters: null | any[]; // Define a more specific type if chapter structure is known
  duration: number;
  language: string;
  playlist: null | any; // Define a more specific type if playlist structure is known
  protocol: string;
  uploader: string;
  was_live: boolean;
  age_limit: number;
  extractor: string;
  format_id: string;
  fulltitle: string;
  subtitles: Record<string, any>; // Define a more specific type if subtitle structure is known
  thumbnail: string;
  categories: string[];
  channel_id: string;
  display_id: string;
  like_count: number;
  resolution: string;
  thumbnails: Thumbnail[];
  view_count: number;
  channel_url: string;
  description: string;
  format_note: string;
  live_status: string;
  upload_date: string;
  uploader_id: string;
  webpage_url: string;
  aspect_ratio: number;
  availability: string;
  original_url: string;
  release_year: null | number;
  uploader_url: string;
  comment_count: number;
  dynamic_range: string;
  extractor_key: string;
  audio_channels: number;
  average_rating: null | number;
  playlist_index: null | number;
  duration_string: string;
  filesize_approx: number;
  stretched_ratio: null | number;
  playable_in_embed: boolean;
  release_timestamp: null | number;
  requested_formats: any[]; // Define a more specific type if needed
  automatic_captions: AutomaticCaptions;
  webpage_url_domain: string;
  _format_sort_fields: string[];
  requested_downloads: any[]; // Define a more specific type if needed
  requested_subtitles: null | any; // Define a more specific type if needed
  webpage_url_basename: string;
  channel_follower_count: number;
};
