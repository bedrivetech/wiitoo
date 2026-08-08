export interface Creator {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  followers: number;
  following: boolean;
  subscribed: boolean;
  isExclusive: boolean;
  isLive: boolean;
  badges?: Badge[];
}

export interface Badge {
  type: 'exclusive' | 'verified' | 'founder' | 'mod';
  label: string;
}

export interface VideoData {
  id: string;
  title: string;
  creator: Creator;
  views: number;
  likes: number;
  publishedAt: string;
  duration: number; // seconds
  isLive: boolean;
  liveViewers?: number;
  description: string;
  category?: string;
  tags?: string[];
  hlsUrl: string;
  posterUrl?: string;
}

export interface Comment {
  id: string;
  author: {
    username: string;
    displayName: string;
    avatarUrl?: string;
    isExclusive: boolean;
  };
  text: string;
  createdAt: string;
  reactions: {
    fire: number;
    heart: number;
    laugh: number;
  };
  userReacted?: 'fire' | 'heart' | 'laugh';
  replies?: Comment[];
  timestamp?: number; // video seek time
  isPinned?: boolean;
  isCreator?: boolean;
  isSuperchat?: boolean;
  superchatAmount?: number;
}

export interface ChatMessage {
  id: string;
  username: string;
  displayName: string;
  text: string;
  badge?: 'sub' | 'exclusive' | 'mod';
  isSuperchat?: boolean;
  superchatAmount?: number;
  timestamp: number;
}

export interface WatchPageData {
  video: VideoData;
  comments: Comment[];
  relatedVideos?: VideoData[];
}