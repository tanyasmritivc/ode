export type Profile = {
  id: string;
  username: string;
  name: string;
  bio: string;
  avatar_url: string | null;
  top_interests: string[];
  notify_on_follow?: boolean | null;
  created_at: string;
};

export type Post = {
  id: string;
  user_id: string;
  title: string;
  caption: string | null;
  image_url: string;
  created_at: string;
};

export type Tag = {
  id: string;
  name: string;
};

export type PostTag = {
  post_id: string;
  tag_id: string;
};

export type Follow = {
  follower_id: string;
  following_id: string;
  created_at: string;
};

export type Weave = {
  id: string;
  user_id: string;
  prompt: string;
  created_at: string;
};

export type WeavePost = {
  weave_id: string;
  post_id: string;
  position: number;
};

export type NotificationType = "follow" | "follow_back";

export type Notification = {
  id: string;
  recipient_id: string;
  actor_id: string;
  type: NotificationType;
  read: boolean;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & Pick<Profile, "id" | "username" | "name">;
        Update: Partial<Profile>;
      };
      posts: {
        Row: Post;
        Insert: Partial<Post> & Pick<Post, "user_id" | "title" | "image_url">;
        Update: Partial<Post>;
      };
      tags: {
        Row: Tag;
        Insert: Partial<Tag> & Pick<Tag, "name">;
        Update: Partial<Tag>;
      };
      post_tags: {
        Row: PostTag;
        Insert: PostTag;
        Update: Partial<PostTag>;
      };
      follows: {
        Row: Follow;
        Insert: Pick<Follow, "follower_id" | "following_id">;
        Update: Partial<Follow>;
      };
      weaves: {
        Row: Weave;
        Insert: Partial<Weave> & Pick<Weave, "user_id" | "prompt">;
        Update: Partial<Weave>;
      };
      weave_posts: {
        Row: WeavePost;
        Insert: WeavePost;
        Update: Partial<WeavePost>;
      };
      notifications: {
        Row: Notification;
        Insert: Pick<Notification, "recipient_id" | "actor_id" | "type">;
        Update: Partial<Pick<Notification, "read">>;
      };
    };
  };
};

// Convenience joined shapes used throughout the UI.
export type PostWithTags = Post & { tags: string[] };
export type PostWithAuthor = Post & { tags: string[]; author: Profile };
