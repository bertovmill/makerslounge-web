/**
 * Create the MakersLounge #10 Claude Code Workshop recap blog post.
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const content = fs.readFileSync('/tmp/blog-makerslounge-10.md', 'utf-8')

const newPost = {
  slug: 'makerslounge-10-claude-code-workshop',
  title: 'Inside MakersLounge #10: A Claude Code Build Night with TMU Byte',
  excerpt:
    "49 makers, one fantastic workshop from Vimal, and a room full of real software shipped in 90 minutes. Here's what went down at our biggest night yet — in partnership with TMU Byte.",
  cover_image: '/recaps/claude-code-workshop/1.jpg',
  content,
  tags: ['Events', 'Claude Code', 'AI', 'Community', 'Toronto'],
  read_time_minutes: 5,
  is_published: true,
  is_featured: true,
  published_at: new Date().toISOString(),
  author_id: '4bf42cee-a293-4cb8-a979-d80e0f81644e',
}

async function createPost() {
  console.log('Creating MakersLounge #10 recap blog post...\n')

  const { data: existing } = await supabase
    .from('blog_posts')
    .select('slug')
    .eq('slug', newPost.slug)
    .single()

  if (existing) {
    console.log('⚠️  Post already exists. Deleting...')
    await supabase.from('blog_posts').delete().eq('slug', newPost.slug)
  }

  const { data, error } = await supabase
    .from('blog_posts')
    .insert(newPost)
    .select()
    .single()

  if (error) {
    console.error('❌ Failed:', error.message)
    process.exit(1)
  }

  console.log('✅ Blog post published!')
  console.log(`   Title: ${data.title}`)
  console.log(`   Slug: ${data.slug}`)
  console.log(`   Featured: ${data.is_featured}`)
  console.log(`   Tags: ${data.tags.join(', ')}`)
  console.log(`   Read time: ${data.read_time_minutes} minutes`)
  console.log(`\n   Live at: https://makerslounge.ca/blog/${data.slug}`)
  console.log(`   Edit at: https://makerslounge.ca/admin/blog/${data.id}\n`)
}

createPost()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
