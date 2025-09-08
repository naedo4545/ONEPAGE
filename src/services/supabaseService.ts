import { supabase, type User, type BusinessCard, type MediaSample, type Feedback, type VideoRequest } from '../lib/supabase'

// Auth functions
export const authService = {
  async signUp(email: string, password: string, username: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username
        }
      }
    })
    return { data, error }
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  onAuthStateChange(callback: (user: any) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null)
    })
  }
}

// User functions
export const userService = {
  async createUser(userData: Partial<User>) {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single()
    return { data, error }
  },

  async getUserByUsername(username: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single()
    return { data, error }
  },

  async updateUser(userId: string, updates: Partial<User>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    return { data, error }
  }
}

// Business Card functions
export const cardService = {
  async createCard(cardData: Partial<BusinessCard>) {
    const { data, error } = await supabase
      .from('business_cards')
      .insert([cardData])
      .select()
      .single()
    return { data, error }
  },

  async getCardsByUser(userId: string) {
    const { data, error } = await supabase
      .from('business_cards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  async getPublicCards() {
    const { data, error } = await supabase
      .from('business_cards')
      .select(`
        *,
        users!inner(username)
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  async updateCard(cardId: string, updates: Partial<BusinessCard>) {
    const { data, error } = await supabase
      .from('business_cards')
      .update(updates)
      .eq('id', cardId)
      .select()
      .single()
    return { data, error }
  },

  async deleteCard(cardId: string) {
    const { error } = await supabase
      .from('business_cards')
      .delete()
      .eq('id', cardId)
    return { error }
  }
}

// Media Sample functions
export const mediaService = {
  async getMediaSamples() {
    const { data, error } = await supabase
      .from('media_samples')
      .select('*')
      .order('created_at', { ascending: false })
    return { data, error }
  },

  async uploadMediaFile(file: File, fileName: string) {
    const { data, error } = await supabase.storage
      .from('media-samples')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      }, {
        // Bypass RLS for public uploads
        headers: {
          'x-upload-content-type': file.type,
          'x-upload-content-length': file.size.toString()
        }
      })
    return { data, error }
  },

  async getMediaFileUrl(fileName: string) {
    const { data } = supabase.storage
      .from('media-samples')
      .getPublicUrl(fileName)
    return data.publicUrl
  },

  async updateMediaSampleRating(sampleId: string, userId: string, rating: number) {
    const { data, error } = await supabase
      .from('media_samples')
      .update({
        ratings: supabase.rpc('update_rating', {
          sample_id: sampleId,
          user_id: userId,
          rating: rating
        })
      })
      .eq('id', sampleId)
      .select()
      .single()
    return { data, error }
  },

  async toggleMediaSampleLike(sampleId: string, userId: string) {
    const { data, error } = await supabase
      .from('media_samples')
      .update({
        liked_by: supabase.rpc('toggle_like', {
          sample_id: sampleId,
          user_id: userId
        })
      })
      .eq('id', sampleId)
      .select()
      .single()
    return { data, error }
  }
}

// Feedback functions
export const feedbackService = {
  async createFeedback(feedbackData: Partial<Feedback>) {
    const { data, error } = await supabase
      .from('feedback')
      .insert([feedbackData])
      .select()
      .single()
    return { data, error }
  },

  async getFeedbackByUser(userId: string) {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    return { data, error }
  }
}

// Video Request functions
export const videoService = {
  async createVideoRequest(requestData: Partial<VideoRequest>) {
    const { data, error } = await supabase
      .from('video_requests')
      .insert([requestData])
      .select()
      .single()
    return { data, error }
  },

  async getVideoRequestsByUser(username: string) {
    const { data, error } = await supabase
      .from('video_requests')
      .select('*')
      .eq('username', username)
      .order('created_at', { ascending: false })
    return { data, error }
  }
}
