// models/announcement.model.ts
export interface Announcement {
  id: number;
  title: string;
  description: string;
  category: 'EVENTS' | 'WORKSHOPS' | 'PERFORMANCES';
  media_type: 'IMAGE' | 'VIDEO';
  media_url: string;
  image_storage?: string;
  registration_enabled: boolean;
  registration_type?: 'FREE' | 'PAID';
  price?: number;
  created_by: number;
  creator_name?: string;
  created_at: string;
  user_registered?: boolean;
}

// models/post.model.ts
export interface Post {
  id: number;
  title?: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  author_name?: string;
  created_at: string;
}