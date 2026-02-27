import express, { Request, Response } from 'express'
import cors from 'cors'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import multer from 'multer'
import path from 'path'
import { sendNewsletterEmail } from './services/emailService'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)
// Admin client for storage ops
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

const UPLOAD_BUCKET = process.env.SUPABASE_BUCKET || 'images'

// Multer for multipart parsing (memory storage)
const upload = multer({ storage: multer.memoryStorage() })

// Middleware
// CORS configuration - allow production frontend URL
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:3000']

// Add Vercel preview URLs dynamically
if (process.env.VERCEL) {
  allowedOrigins.push(`https://${process.env.VERCEL_URL}`)
}

const corsOptions = {
  origin: function (origin: string | undefined, callback: Function) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true)
    
    // Check if origin is in allowed list
    if (allowedOrigins.some(allowed => {
      if (allowed.includes('*')) {
        // Support wildcard subdomains
        const pattern = allowed.replace('*.', '.*\\.')
        return new RegExp(`^https?://${pattern}`).test(origin)
      }
      return origin === allowed || origin.startsWith(allowed)
    })) {
      callback(null, true)
    } else {
      // In development, allow all origins
      if (process.env.NODE_ENV !== 'production') {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
}
app.use(cors(corsOptions))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))

// Root route - Welcome message
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'Welcome to Daily Better Journey API!',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      posts: '/api/posts',
      jobs: '/api/jobs',
      categories: '/api/categories',
      countries: '/api/countries',
      newsletter: '/api/newsletter/subscribe',
      documentation: 'Check README.md for full API documentation'
    },
    timestamp: new Date().toISOString()
  })
})

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    message: 'Daily Better Journey API is running',
    timestamp: new Date().toISOString()
  })
})

// Countries Routes
app.get('/api/countries', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('countries')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error
    res.json({ success: true, data })
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch countries', error: error.message })
  }
})

app.post('/api/countries', async (req: Request, res: Response) => {
  try {
    const { name, code, flag_emoji, flag_image, region, description } = req.body
    if (!name || !code) return res.status(400).json({ success: false, message: 'Name and code are required' })
    
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    const { data, error } = await supabase
      .from('countries')
      .insert([{ name, slug, code, flag_emoji, flag_image, region, description }])
      .select()
      .single()

    if (error) throw error
    res.json({ success: true, message: 'Country created', data })
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to create country', error: error.message })
  }
})

app.put('/api/countries/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { name, code, flag_emoji, flag_image, region, description } = req.body
    const updateData: any = {}
    
    if (name !== undefined) {
      updateData.name = name
      updateData.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    }
    if (code !== undefined) updateData.code = code
    if (flag_emoji !== undefined) updateData.flag_emoji = flag_emoji
    if (flag_image !== undefined) updateData.flag_image = flag_image
    if (region !== undefined) updateData.region = region
    if (description !== undefined) updateData.description = description

    const { data, error } = await supabase
      .from('countries')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    res.json({ success: true, message: 'Country updated', data })
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update country', error: error.message })
  }
})

app.delete('/api/countries/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { error } = await supabase.from('countries').delete().eq('id', id)
    if (error) throw error
    res.json({ success: true, message: 'Country deleted' })
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to delete country', error: error.message })
  }
})

// Get posts by country
app.get('/api/countries/:slug/posts', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params
    const { data: country, error: countryErr } = await supabase
      .from('countries')
      .select('*')
      .eq('slug', slug)
      .single()
    if (countryErr) throw countryErr

    const { data: posts, error: postsErr } = await supabase
      .from('posts')
      .select('*')
      .eq('country_id', country.id)
      .eq('status', 'published')
      .order('created_at', { ascending: false })

    if (postsErr) throw postsErr
    res.json({ success: true, country, data: posts })
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch posts by country', error: error.message })
  }
})

// Blog Posts Routes
// Categories Routes
app.get('/api/categories', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error
    res.json({ success: true, data })
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch categories', error: error.message })
  }
})

app.post('/api/categories', async (req: Request, res: Response) => {
  try {
    const { name, slug, description } = req.body
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' })
    const generatedSlug = (slug || name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const { data, error } = await supabase
      .from('categories')
      .insert([{ name, slug: generatedSlug, description: description || null }])
      .select()
      .single()

    if (error) throw error
    res.json({ success: true, message: 'Category created', data })
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to create category', error: error.message })
  }
})

app.put('/api/categories/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { name, slug, description } = req.body
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (slug !== undefined) updateData.slug = slug
    if (description !== undefined) updateData.description = description

    const { data, error } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    res.json({ success: true, message: 'Category updated', data })
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update category', error: error.message })
  }
})

app.delete('/api/categories/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) throw error
    res.json({ success: true, message: 'Category deleted' })
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to delete category', error: error.message })
  }
})

// Posts by category slug (published only by default)
app.get('/api/categories/:slug/posts', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params
    // Find category
    const { data: category, error: catErr } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single()
    if (catErr) throw catErr

    // Get posts
    const { data: posts, error: postsErr } = await supabase
      .from('posts')
      .select('*')
      .eq('category_id', category.id)
      .order('created_at', { ascending: false })

    if (postsErr) throw postsErr
    res.json({ success: true, category, data: posts })
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch posts by category', error: error.message })
  }
})

app.get('/api/posts', async (req: Request, res: Response) => {
  try {
    // Get posts with related data
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        categories:category_id(name, slug),
        countries:country_id(name, slug, flag_emoji),
        funding_types:funding_type_id(name, slug)
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    // Get degree levels for each post
    const postsWithDegrees = await Promise.all(
      (data || []).map(async (post: any) => {
        const { data: degreeLevels } = await supabase
          .from('post_degree_levels')
          .select('degree_levels:degree_level_id(id, name, slug)')
          .eq('post_id', post.id)
        
        const { data: tags } = await supabase
          .from('post_tags')
          .select('tags:tag_id(id, name, slug)')
          .eq('post_id', post.id)
        
        return {
          ...post,
          degree_levels: degreeLevels?.map((dl: any) => dl.degree_levels) || [],
          tags: tags?.map((t: any) => t.tags) || []
        }
      })
    )
    
    res.json({ success: true, data: postsWithDegrees })
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch posts',
      error: error.message 
    })
  }
})

app.get('/api/posts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        categories:category_id(name, slug),
        countries:country_id(name, slug, flag_emoji),
        funding_types:funding_type_id(name, slug)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error

    // Get degree levels
    const { data: degreeLevels } = await supabase
      .from('post_degree_levels')
      .select('degree_levels:degree_level_id(id, name, slug)')
      .eq('post_id', id)

    // Get tags
    const { data: tags } = await supabase
      .from('post_tags')
      .select('tags:tag_id(id, name, slug)')
      .eq('post_id', id)

    const postWithRelations = {
      ...data,
      degree_levels: degreeLevels?.map((dl: any) => dl.degree_levels) || [],
      tags: tags?.map((t: any) => t.tags) || []
    }
    
    res.json({ success: true, data: postWithRelations })
  } catch (error: any) {
    res.status(404).json({ 
      success: false, 
      message: 'Post not found',
      error: error.message 
    })
  }
})

// Create new post
app.post('/api/posts', async (req: Request, res: Response) => {
  try {
    const { 
      title, slug, excerpt, content, featured_image, is_featured, status, 
      category_id, country_id, tags, meta_description, meta_keywords, seo_title,
      // Scholarship-specific fields
      scholarship_provider, university_name, funding_type_id, application_deadline,
      program_duration, eligible_nationalities, application_fee, application_fee_amount,
      official_website, apply_link, scholarship_benefits, eligibility_criteria,
      required_documents, how_to_apply, notes, contact_email, application_mode,
      available_seats, host_university_logo, scholarship_brochure_pdf, video_embed,
      faq_data, scheduled_publish_at, degree_level_ids
    } = req.body
    
    if (!title || !content) {
      return res.status(400).json({ 
        success: false, 
        message: 'Title and content are required' 
      })
    }

    // Generate slug if not provided
    const generatedSlug = slug || title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    
    const postData: any = {
      title,
      slug: generatedSlug,
      excerpt: excerpt || content.substring(0, 200),
      content,
      featured_image: featured_image || null,
      is_featured: !!is_featured,
      status: status || 'draft',
      author_id: 'admin', // TODO: Get from auth middleware
      views: 0,
      meta_description: meta_description || null,
      meta_keywords: meta_keywords || null,
      seo_title: seo_title || null,
      category_id: category_id || null,
      country_id: country_id || null,
      // Scholarship fields
      scholarship_provider: scholarship_provider || null,
      university_name: university_name || null,
      funding_type_id: funding_type_id || null,
      application_deadline: application_deadline || null,
      program_duration: program_duration || null,
      eligible_nationalities: eligible_nationalities || null,
      application_fee: application_fee || false,
      application_fee_amount: application_fee_amount || null,
      official_website: official_website || null,
      apply_link: apply_link || null,
      scholarship_benefits: scholarship_benefits || null,
      eligibility_criteria: eligibility_criteria || null,
      required_documents: required_documents || null,
      how_to_apply: how_to_apply || null,
      notes: notes || null,
      contact_email: contact_email || null,
      application_mode: application_mode || null,
      available_seats: available_seats || null,
      host_university_logo: host_university_logo || null,
      scholarship_brochure_pdf: scholarship_brochure_pdf || null,
      video_embed: video_embed || null,
      faq_data: faq_data || null,
      scheduled_publish_at: scheduled_publish_at || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const { data, error } = await supabase
      .from('posts')
      .insert([postData])
      .select()
      .single()
    
    if (error) throw error

    // Handle tags if provided
    if (tags && Array.isArray(tags) && tags.length > 0) {
      // Get or create tags and link them
      for (const tagName of tags) {
        if (!tagName) continue
        const tagSlug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        
        // Try to find existing tag
        let { data: existingTag } = await supabase
          .from('tags')
          .select('id')
          .eq('slug', tagSlug)
          .single()
        
        let tagId
        if (!existingTag) {
          // Create new tag
          const { data: newTag, error: tagError } = await supabase
            .from('tags')
            .insert([{ name: tagName, slug: tagSlug }])
            .select('id')
            .single()
          if (!tagError && newTag) tagId = newTag.id
        } else {
          tagId = existingTag.id
        }
        
        if (tagId) {
          await supabase.from('post_tags').insert([{ post_id: data.id, tag_id: tagId }])
        }
      }
    }

    // Handle degree levels if provided
    if (degree_level_ids && Array.isArray(degree_level_ids) && degree_level_ids.length > 0) {
      const degreeLevelLinks = degree_level_ids.map((degreeId: string) => ({
        post_id: data.id,
        degree_level_id: degreeId
      }))
      await supabase.from('post_degree_levels').insert(degreeLevelLinks)
    }
    
    // Send email to subscribers if post is published
    if (data.status === 'published') {
      try {
        // Get all active newsletter subscribers
        const { data: subscribers } = await supabase
          .from('newsletter_subscribers')
          .select('email')
          .eq('is_active', true)
        
        if (subscribers && subscribers.length > 0) {
          // Send emails asynchronously (don't wait for it)
          sendNewsletterEmail(data, subscribers).catch(err => {
            console.error('Error sending newsletter emails:', err)
          })
          console.log(`Newsletter email queued for ${subscribers.length} subscribers`)
        }
      } catch (emailError: any) {
        console.error('Failed to send newsletter emails:', emailError.message)
        // Don't fail the request if email fails
      }
    }
    
    res.json({ 
      success: true, 
      message: 'Post created successfully',
      data 
    })
  } catch (error: any) {
    console.error('Create post error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create post',
      error: error.message 
    })
  }
})

// Update post
app.put('/api/posts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { 
      title, slug, excerpt, content, featured_image, is_featured, status, 
      category_id, country_id, tags, meta_description, meta_keywords, seo_title,
      // Scholarship-specific fields
      scholarship_provider, university_name, funding_type_id, application_deadline,
      program_duration, eligible_nationalities, application_fee, application_fee_amount,
      official_website, apply_link, scholarship_benefits, eligibility_criteria,
      required_documents, how_to_apply, notes, contact_email, application_mode,
      available_seats, host_university_logo, scholarship_brochure_pdf, video_embed,
      faq_data, scheduled_publish_at, degree_level_ids
    } = req.body
    
    const updateData: any = {
      updated_at: new Date().toISOString()
    }
    
    if (title) updateData.title = title
    if (slug) updateData.slug = slug
    if (excerpt !== undefined) updateData.excerpt = excerpt
    if (content) updateData.content = content
    if (featured_image !== undefined) updateData.featured_image = featured_image
    if (is_featured !== undefined) updateData.is_featured = !!is_featured
    if (status) updateData.status = status
    if (category_id !== undefined) updateData.category_id = category_id
    if (country_id !== undefined) updateData.country_id = country_id
    if (meta_description !== undefined) updateData.meta_description = meta_description
    if (meta_keywords !== undefined) updateData.meta_keywords = meta_keywords
    if (seo_title !== undefined) updateData.seo_title = seo_title
    // Scholarship fields
    if (scholarship_provider !== undefined) updateData.scholarship_provider = scholarship_provider
    if (university_name !== undefined) updateData.university_name = university_name
    if (funding_type_id !== undefined) updateData.funding_type_id = funding_type_id
    if (application_deadline !== undefined) updateData.application_deadline = application_deadline
    if (program_duration !== undefined) updateData.program_duration = program_duration
    if (eligible_nationalities !== undefined) updateData.eligible_nationalities = eligible_nationalities
    if (application_fee !== undefined) updateData.application_fee = application_fee
    if (application_fee_amount !== undefined) updateData.application_fee_amount = application_fee_amount
    if (official_website !== undefined) updateData.official_website = official_website
    if (apply_link !== undefined) updateData.apply_link = apply_link
    if (scholarship_benefits !== undefined) updateData.scholarship_benefits = scholarship_benefits
    if (eligibility_criteria !== undefined) updateData.eligibility_criteria = eligibility_criteria
    if (required_documents !== undefined) updateData.required_documents = required_documents
    if (how_to_apply !== undefined) updateData.how_to_apply = how_to_apply
    if (notes !== undefined) updateData.notes = notes
    if (contact_email !== undefined) updateData.contact_email = contact_email
    if (application_mode !== undefined) updateData.application_mode = application_mode
    if (available_seats !== undefined) updateData.available_seats = available_seats
    if (host_university_logo !== undefined) updateData.host_university_logo = host_university_logo
    if (scholarship_brochure_pdf !== undefined) updateData.scholarship_brochure_pdf = scholarship_brochure_pdf
    if (video_embed !== undefined) updateData.video_embed = video_embed
    if (faq_data !== undefined) updateData.faq_data = faq_data
    if (scheduled_publish_at !== undefined) updateData.scheduled_publish_at = scheduled_publish_at
    
    // Get current post to check if status is changing to published
    const { data: currentPost } = await supabase
      .from('posts')
      .select('status')
      .eq('id', id)
      .single()
    
    const wasJustPublished = status === 'published' && currentPost?.status !== 'published'
    
    const { data, error } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    if (!data) {
      return res.status(404).json({ 
        success: false, 
        message: 'Post not found' 
      })
    }

    // Handle tags update if provided
    if (tags !== undefined && Array.isArray(tags)) {
      // Delete existing tags
      await supabase.from('post_tags').delete().eq('post_id', id)
      
      // Add new tags
      for (const tagName of tags) {
        if (!tagName) continue
        const tagSlug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        
        let { data: existingTag } = await supabase
          .from('tags')
          .select('id')
          .eq('slug', tagSlug)
          .single()
        
        let tagId
        if (!existingTag) {
          const { data: newTag, error: tagError } = await supabase
            .from('tags')
            .insert([{ name: tagName, slug: tagSlug }])
            .select('id')
            .single()
          if (!tagError && newTag) tagId = newTag.id
        } else {
          tagId = existingTag.id
        }
        
        if (tagId) {
          await supabase.from('post_tags').insert([{ post_id: id, tag_id: tagId }])
        }
      }
    }

    // Handle degree levels update if provided
    if (degree_level_ids !== undefined && Array.isArray(degree_level_ids)) {
      // Delete existing degree level links
      await supabase.from('post_degree_levels').delete().eq('post_id', id)
      
      // Add new degree level links
      if (degree_level_ids.length > 0) {
        const degreeLevelLinks = degree_level_ids.map((degreeId: string) => ({
          post_id: id,
          degree_level_id: degreeId
        }))
        await supabase.from('post_degree_levels').insert(degreeLevelLinks)
      }
    }
    
    // Send email to subscribers if post was just published (status changed from draft to published)
    if (wasJustPublished) {
      try {
        // Get all active newsletter subscribers
        const { data: subscribers } = await supabase
          .from('newsletter_subscribers')
          .select('email')
          .eq('is_active', true)
        
        if (subscribers && subscribers.length > 0) {
          // Send emails asynchronously (don't wait for it)
          sendNewsletterEmail(data, subscribers).catch(err => {
            console.error('Error sending newsletter emails:', err)
          })
          console.log(`Newsletter email queued for ${subscribers.length} subscribers`)
        }
      } catch (emailError: any) {
        console.error('Failed to send newsletter emails:', emailError.message)
        // Don't fail the request if email fails
      }
    }
    
    res.json({ 
      success: true, 
      message: 'Post updated successfully',
      data 
    })
  } catch (error: any) {
    console.error('Update post error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update post',
      error: error.message 
    })
  }
})

// Delete post
app.delete('/api/posts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    res.json({ 
      success: true, 
      message: 'Post deleted successfully' 
    })
  } catch (error: any) {
    console.error('Delete post error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete post',
      error: error.message 
    })
  }
})

// Update post status
app.patch('/api/posts/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { status } = req.body
    
    if (!status || !['draft', 'published'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid status (draft or published) is required' 
      })
    }
    
    const { data, error } = await supabase
      .from('posts')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    res.json({ 
      success: true, 
      message: 'Post status updated successfully',
      data 
    })
  } catch (error: any) {
    console.error('Update status error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update post status',
      error: error.message 
    })
  }
})

// ============ JOBS ROUTES ============
// Employment types (read-only)
app.get('/api/employment-types', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('employment_types')
      .select('*')
      .order('name', { ascending: true })
    if (error) throw error
    res.json({ success: true, data })
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch employment types', error: error.message })
  }
})

// Get all jobs (admin sees all, public could filter by status in frontend)
app.get('/api/jobs', async (req: Request, res: Response) => {
  try {
    const { location_type } = req.query
    let query = supabase
      .from('jobs')
      .select(`
        *,
        countries:country_id(name, slug, flag_emoji),
        employment_types:employment_type_id(name, slug)
      `)
      .order('created_at', { ascending: false })

    if (location_type && (location_type === 'national' || location_type === 'international')) {
      query = query.eq('location_type', location_type)
    }

    const { data, error } = await query
    if (error) throw error
    res.json({ success: true, data: data || [] })
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch jobs', error: error.message })
  }
})

// Get job by slug (must be before :id to avoid "slug" being parsed as id)
app.get('/api/jobs/slug/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        countries:country_id(name, slug, flag_emoji),
        employment_types:employment_type_id(name, slug)
      `)
      .eq('slug', slug)
      .single()
    if (error) throw error
    if (!data) return res.status(404).json({ success: false, message: 'Job not found' })
    res.json({ success: true, data })
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch job', error: error.message })
  }
})

// Get single job by id
app.get('/api/jobs/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        countries:country_id(name, slug, flag_emoji),
        employment_types:employment_type_id(name, slug)
      `)
      .eq('id', id)
      .single()
    if (error) throw error
    if (!data) return res.status(404).json({ success: false, message: 'Job not found' })
    res.json({ success: true, data })
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch job', error: error.message })
  }
})

// Create job
app.post('/api/jobs', async (req: Request, res: Response) => {
  try {
    const {
      title, slug, excerpt, content, featured_image, is_featured, status,
      company_name, company_logo, location_type, country_id, employment_type_id,
      salary_range, remote_work, application_deadline, apply_link, contact_email,
      job_requirements, job_responsibilities, benefits, experience_level,
      meta_description, meta_keywords, seo_title, scheduled_publish_at
    } = req.body

    if (!title || !content || !company_name || !location_type) {
      return res.status(400).json({ success: false, message: 'Title, content, company name, and location type are required' })
    }

    const generatedSlug = slug || title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const jobData: any = {
      title,
      slug: generatedSlug,
      excerpt: excerpt || content.substring(0, 200),
      content,
      featured_image: featured_image || null,
      is_featured: !!is_featured,
      status: status || 'draft',
      author_id: 'admin',
      views: 0,
      meta_description: meta_description || null,
      meta_keywords: meta_keywords || null,
      seo_title: seo_title || null,
      company_name,
      company_logo: company_logo || null,
      location_type: location_type === 'national' || location_type === 'international' ? location_type : 'national',
      country_id: country_id || null,
      employment_type_id: employment_type_id || null,
      salary_range: salary_range || null,
      remote_work: remote_work || null,
      application_deadline: application_deadline || null,
      apply_link: apply_link || null,
      contact_email: contact_email || null,
      job_requirements: job_requirements || null,
      job_responsibilities: job_responsibilities || null,
      benefits: benefits || null,
      experience_level: experience_level || null,
      scheduled_publish_at: scheduled_publish_at || null
    }

    const { data, error } = await supabase
      .from('jobs')
      .insert([jobData])
      .select()
      .single()
    if (error) throw error
    res.json({ success: true, message: 'Job created successfully', data })
  } catch (error: any) {
    console.error('Create job error:', error)
    res.status(500).json({ success: false, message: 'Failed to create job', error: error.message })
  }
})

// Update job
app.put('/api/jobs/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const {
      title, slug, excerpt, content, featured_image, is_featured, status,
      company_name, company_logo, location_type, country_id, employment_type_id,
      salary_range, remote_work, application_deadline, apply_link, contact_email,
      job_requirements, job_responsibilities, benefits, experience_level,
      meta_description, meta_keywords, seo_title, scheduled_publish_at
    } = req.body

    const updateData: any = { updated_at: new Date().toISOString() }
    if (title) updateData.title = title
    if (slug) updateData.slug = slug
    if (excerpt !== undefined) updateData.excerpt = excerpt
    if (content) updateData.content = content
    if (featured_image !== undefined) updateData.featured_image = featured_image
    if (is_featured !== undefined) updateData.is_featured = !!is_featured
    if (status) updateData.status = status
    if (company_name) updateData.company_name = company_name
    if (company_logo !== undefined) updateData.company_logo = company_logo
    if (location_type) updateData.location_type = location_type
    if (country_id !== undefined) updateData.country_id = country_id
    if (employment_type_id !== undefined) updateData.employment_type_id = employment_type_id
    if (salary_range !== undefined) updateData.salary_range = salary_range
    if (remote_work !== undefined) updateData.remote_work = remote_work
    if (application_deadline !== undefined) updateData.application_deadline = application_deadline
    if (apply_link !== undefined) updateData.apply_link = apply_link
    if (contact_email !== undefined) updateData.contact_email = contact_email
    if (job_requirements !== undefined) updateData.job_requirements = job_requirements
    if (job_responsibilities !== undefined) updateData.job_responsibilities = job_responsibilities
    if (benefits !== undefined) updateData.benefits = benefits
    if (experience_level !== undefined) updateData.experience_level = experience_level
    if (meta_description !== undefined) updateData.meta_description = meta_description
    if (meta_keywords !== undefined) updateData.meta_keywords = meta_keywords
    if (seo_title !== undefined) updateData.seo_title = seo_title
    if (scheduled_publish_at !== undefined) updateData.scheduled_publish_at = scheduled_publish_at

    const { data, error } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    if (!data) return res.status(404).json({ success: false, message: 'Job not found' })
    res.json({ success: true, message: 'Job updated successfully', data })
  } catch (error: any) {
    console.error('Update job error:', error)
    res.status(500).json({ success: false, message: 'Failed to update job', error: error.message })
  }
})

// Delete job
app.delete('/api/jobs/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { error } = await supabase.from('jobs').delete().eq('id', id)
    if (error) throw error
    res.json({ success: true, message: 'Job deleted successfully' })
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to delete job', error: error.message })
  }
})

// Update job status
app.patch('/api/jobs/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { status } = req.body
    if (!status || !['draft', 'published'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Valid status (draft or published) is required' })
    }
    const { data, error } = await supabase
      .from('jobs')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    res.json({ success: true, message: 'Job status updated', data })
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update job status', error: error.message })
  }
})

// Newsletter Routes
app.post('/api/newsletter/subscribe', async (req: Request, res: Response) => {
  try {
    const { email } = req.body
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      })
    }
    
    // Check if already subscribed
    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('id, is_active')
      .eq('email', email.toLowerCase())
      .single()
    
    if (existing) {
      // If exists but inactive, reactivate it
      if (!existing.is_active) {
        const { data, error } = await supabase
          .from('newsletter_subscribers')
          .update({ is_active: true, subscribed_at: new Date().toISOString(), unsubscribed_at: null })
          .eq('id', existing.id)
          .select()
          .single()
        
        if (error) throw error
        return res.json({ 
          success: true, 
          message: 'Successfully resubscribed to newsletter',
          data 
        })
      }
      
      // Already subscribed and active
      return res.json({ 
        success: true, 
        message: 'You are already subscribed to our newsletter',
        data: existing 
      })
    }
    
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .insert([{ email: email.toLowerCase(), is_active: true }])
      .select()
      .single()
    
    if (error) throw error
    
    res.json({ 
      success: true, 
      message: 'Successfully subscribed to newsletter',
      data 
    })
  } catch (error: any) {
    console.error('Newsletter subscription error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Failed to subscribe',
      error: error.message 
    })
  }
})

// Get all newsletter subscribers (admin only)
app.get('/api/newsletter/subscribers', async (req: Request, res: Response) => {
  try {
    const { active_only, page = 1, limit = 100 } = req.query
    
    let query = supabase
      .from('newsletter_subscribers')
      .select('*', { count: 'exact' })
      .order('subscribed_at', { ascending: false })
    
    if (active_only === 'true') {
      query = query.eq('is_active', true)
    }
    
    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const from = (pageNum - 1) * limitNum
    const to = from + limitNum - 1
    
    query = query.range(from, to)
    
    const { data, error, count } = await query
    
    if (error) throw error
    
    res.json({
      success: true,
      data: data || [],
      total: count || 0,
      page: pageNum,
      limit: limitNum
    })
  } catch (error: any) {
    console.error('Get subscribers error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get subscribers',
      error: error.message
    })
  }
})

// Unsubscribe from newsletter
app.post('/api/newsletter/unsubscribe', async (req: Request, res: Response) => {
  try {
    const { email } = req.body
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      })
    }
    
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .update({
        is_active: false,
        unsubscribed_at: new Date().toISOString()
      })
      .eq('email', email.toLowerCase())
      .select()
      .single()
    
    if (error) throw error
    
    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Email not found in subscribers list'
      })
    }
    
    res.json({
      success: true,
      message: 'Successfully unsubscribed from newsletter',
      data
    })
  } catch (error: any) {
    console.error('Unsubscribe error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to unsubscribe',
      error: error.message
    })
  }
})

// Degree Levels Routes
app.get('/api/degree-levels', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('degree_levels')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error
    res.json({ success: true, data })
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch degree levels', error: error.message })
  }
})

app.post('/api/degree-levels', async (req: Request, res: Response) => {
  try {
    const { name, slug, description } = req.body
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' })
    
    const generatedSlug = (slug || name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    const { data, error } = await supabase
      .from('degree_levels')
      .insert([{ name, slug: generatedSlug, description: description || null }])
      .select()
      .single()

    if (error) throw error
    res.json({ success: true, message: 'Degree level created', data })
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to create degree level', error: error.message })
  }
})

app.put('/api/degree-levels/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { name, slug, description } = req.body
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (slug !== undefined) updateData.slug = slug
    if (description !== undefined) updateData.description = description

    const { data, error } = await supabase
      .from('degree_levels')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    res.json({ success: true, message: 'Degree level updated', data })
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update degree level', error: error.message })
  }
})

app.delete('/api/degree-levels/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { error } = await supabase.from('degree_levels').delete().eq('id', id)
    if (error) throw error
    res.json({ success: true, message: 'Degree level deleted' })
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to delete degree level', error: error.message })
  }
})

// Funding Types Routes
app.get('/api/funding-types', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('funding_types')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error
    res.json({ success: true, data })
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch funding types', error: error.message })
  }
})

// Tags Routes
app.get('/api/tags', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error
    res.json({ success: true, data })
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch tags', error: error.message })
  }
})

app.post('/api/tags', async (req: Request, res: Response) => {
  try {
    const { name, slug } = req.body
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' })
    
    const generatedSlug = (slug || name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    const { data, error } = await supabase
      .from('tags')
      .insert([{ name, slug: generatedSlug }])
      .select()
      .single()

    if (error) throw error
    res.json({ success: true, message: 'Tag created', data })
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to create tag', error: error.message })
  }
})

app.put('/api/tags/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { name, slug } = req.body
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (slug !== undefined) updateData.slug = slug

    const { data, error } = await supabase
      .from('tags')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    res.json({ success: true, message: 'Tag updated', data })
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update tag', error: error.message })
  }
})

app.delete('/api/tags/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { error } = await supabase.from('tags').delete().eq('id', id)
    if (error) throw error
    res.json({ success: true, message: 'Tag deleted' })
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to delete tag', error: error.message })
  }
})

// Quotes Routes
app.get('/api/quotes/daily', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (error) throw error
    
    res.json({ success: true, data: data?.[0] || null })
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch daily quote',
      error: error.message 
    })
  }
})

// Image upload endpoint (multipart/form-data)
app.post('/api/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided' })
    }

    const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg'
    const filePath = `posts/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`

    const { error } = await supabaseAdmin.storage
      .from(UPLOAD_BUCKET)
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype || 'image/jpeg',
        upsert: false,
      })

    if (error) throw error

    const { data: pub } = supabaseAdmin.storage.from(UPLOAD_BUCKET).getPublicUrl(filePath)
    return res.json({ success: true, url: pub.publicUrl })
  } catch (error: any) {
    console.error('Upload error:', error)
    return res.status(500).json({ success: false, message: 'Failed to upload image', error: error.message })
  }
})

// Ensure storage bucket exists (best-effort)
const initializeBucket = async () => {
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets()
    const exists = buckets?.some((b) => b.name === UPLOAD_BUCKET)
    if (!exists) {
      await supabaseAdmin.storage.createBucket(UPLOAD_BUCKET, { public: true })
      console.log(`✅ Created bucket: ${UPLOAD_BUCKET}`)
    } else {
      console.log(`✅ Bucket '${UPLOAD_BUCKET}' already exists`)
    }
  } catch (e) {
    console.warn('⚠️  Bucket check/create skipped:', (e as Error).message)
  }
}

// Start server only if not in serverless environment (Vercel)
if (process.env.VERCEL !== '1') {
  app.listen(PORT, async () => {
    console.log(`🚀 Server is running on port ${PORT}`)
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`)
    await initializeBucket()
  })
} else {
  // In serverless environment, initialize bucket on first request
  initializeBucket().catch(console.error)
}

// Export the app for Vercel serverless functions
export default app
