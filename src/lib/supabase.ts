import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface User {
  id: string
  username: string
  email?: string
  created_at: string
  updated_at: string
}

export interface BusinessCard {
  id: string
  user_id: string
  card_data: any
  theme: any
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface MediaSample {
  id: string
  name: string
  src: string
  type: 'image' | 'video'
  ratings: Record<string, number>
  liked_by: string[]
  avg_rating: number
  created_at: string
}

export interface Feedback {
  id: string
  user_id: string
  type: string
  message: string
  created_at: string
}

export interface VideoRequest {
  id: string
  username: string
  prompt: string
  selected_sample_ids: string[]
  status: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: string
}
