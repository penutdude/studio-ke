export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      blogs: {
        Row: {
          id: string
          title: string
          content: string
          author: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          author: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          author?: string
          created_at?: string
          updated_at?: string
        }
      }
      blog_posts: {
        Row: {
          id: string
          title: string
          content: string
          published_at: string | null
          author_id: string | null
          user_id: string | null
          username: string | null
          cover_image_path: string | null
          slug: string | null
          updated_by: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          content: string
          published_at?: string | null
          author_id?: string | null
          user_id?: string | null
          username?: string | null
          cover_image_path?: string | null
          slug?: string | null
          updated_by?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          content?: string
          published_at?: string | null
          author_id?: string | null
          user_id?: string | null
          username?: string | null
          cover_image_path?: string | null
          slug?: string | null
          updated_by?: string | null
          updated_at?: string | null
        }
      }
      blog_categories: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
      }
      blog_post_categories: {
        Row: {
          blog_post_id: string
          category_id: string
        }
        Insert: {
          blog_post_id: string
          category_id: string
        }
        Update: {
          blog_post_id?: string
          category_id?: string
        }
      }
      events: {
        Row: {
          id: string
          title: string
          description: string | null
          event_date: string
          event_time: string | null
          location: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          event_date: string
          event_time?: string | null
          location?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          event_date?: string
          event_time?: string | null
          location?: string | null
          created_by?: string
          created_at?: string
        }
      }
      event_comments: {
        Row: {
          id: string
          event_id: string
          content: string | null
          image_path: string | null
          created_at: string
          created_by: string | null
          user_id: string | null
          username: string | null
          updated_by: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          event_id: string
          content?: string | null
          image_path?: string | null
          created_at?: string
          created_by?: string | null
          user_id?: string | null
          username?: string | null
          updated_by?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          event_id?: string
          content?: string | null
          image_path?: string | null
          created_at?: string
          created_by?: string | null
          user_id?: string | null
          username?: string | null
          updated_by?: string | null
          updated_at?: string | null
        }
      }
      gallery: {
        Row: {
          id: string
          title: string
          description: string | null
          image_url: string
          uploaded_by: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          image_url: string
          uploaded_by: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          image_url?: string
          uploaded_by?: string
          created_at?: string
        }
      }
      family_members: {
        Row: {
          id: string
          name: string
          birth_date: string | null
          relationship: string | null
          parent_id: string | null
          parent2_id: string | null
          spouse_id: string | null
          bio: string | null
          avatar_url: string | null
          instagram_username: string | null
          twitter_username: string | null
          facebook_username: string | null
          created_at: string
          added_by: string | null
          gender: string | null
          location?: string | null
          position_x?: number | null
          position_y?: number | null
          custom_position?: boolean | null
        }
        Insert: {
          id?: string
          name: string
          birth_date?: string | null
          relationship?: string | null
          parent_id?: string | null
          parent2_id?: string | null
          spouse_id?: string | null
          bio?: string | null
          avatar_url?: string | null
          instagram_username?: string | null
          twitter_username?: string | null
          facebook_username?: string | null
          created_at?: string
          added_by?: string | null
          gender?: string | null
        }
        Update: {
          id?: string
          name?: string
          birth_date?: string | null
          relationship?: string | null
          parent_id?: string | null
          parent2_id?: string | null
          spouse_id?: string | null
          bio?: string | null
          avatar_url?: string | null
          instagram_username?: string | null
          twitter_username?: string | null
          facebook_username?: string | null
          created_at?: string
          added_by?: string | null
          gender?: string | null
        }
      }
      admins: {
        Row: {
          id: string
          email: string
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          created_by?: string | null
        }
      }
      pending_users: {
        Row: {
          id: string
          email: string
          created_at: string
          status: string
          approved_by: string | null
          approved_at: string | null
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
          status?: string
          approved_by?: string | null
          approved_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          status?: string
          approved_by?: string | null
          approved_at?: string | null
        }
      }
    }
  }
}
