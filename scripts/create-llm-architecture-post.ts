/**
 * Create LLM Architecture blog post
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

const content = fs.readFileSync('/tmp/blog-llm-architecture.md', 'utf-8')

const newPost = {
  slug: "llm-architecture-revolution-2025",
  title: "The Hidden Architecture Revolution: Why 2025's AI Models Are 10x Cheaper",
  excerpt: "The models are radically better, yet the core architecture hasn't changed in seven years. Here's how tiny optimizations compound into 10x cost reductions—and what that means for builders choosing their AI stack.",
  cover_image: null,
  content: content,
  tags: ["AI", "LLMs", "Deep Learning", "Architecture", "Cost Optimization", "Open Source"],
  read_time_minutes: 12,
  is_published: false, // Save as draft first
  is_featured: false,
  author_id: '4bf42cee-a293-4cb8-a979-d80e0f81644e'
}

async function createPost() {
  console.log('Creating LLM Architecture blog post...\n')

  // Check if post exists
  const { data: existing } = await supabase
    .from('blog_posts')
    .select('slug')
    .eq('slug', newPost.slug)
    .single()

  if (existing) {
    console.log('⚠️  Post already exists. Deleting...')
    await supabase.from('blog_posts').delete().eq('slug', newPost.slug)
  }

  // Insert the post
  const { data, error } = await supabase
    .from('blog_posts')
    .insert(newPost)
    .select()
    .single()

  if (error) {
    console.error('❌ Failed:', error.message)
    process.exit(1)
  }

  console.log('✅ Blog post created as draft!')
  console.log(`   Title: ${data.title}`)
  console.log(`   Slug: ${data.slug}`)
  console.log(`   Tags: ${data.tags.join(', ')}`)
  console.log(`   Read time: ${data.read_time_minutes} minutes`)
  console.log(`\n   Edit at: http://localhost:3000/admin/blog/${data.id}`)
  console.log(`   Preview at: http://localhost:3000/blog/${data.slug} (after publishing)\n`)
}

createPost()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
