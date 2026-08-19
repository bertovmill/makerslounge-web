/**
 * Create LLM Architecture blog post
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

import { upsertPostBySlug } from './lib/blog-post-db'

// Only Next.js loads .env.local automatically; a script has to ask.
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

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

  // Replaces any post already at this slug, so the script is re-runnable.
  await upsertPostBySlug(newPost)

  console.log('✅ Blog post created as draft!')
  console.log(`   Title: ${newPost.title}`)
  console.log(`   Slug: ${newPost.slug}`)
  console.log(`   Tags: ${(newPost.tags ?? []).join(', ')}`)
  console.log(`   Read time: ${newPost.read_time_minutes} minutes`)
  console.log(`\n   Edit at: http://localhost:3000/admin/blog (find it in the list)`)
  console.log(`   Preview at: http://localhost:3000/blog/${newPost.slug} (after publishing)\n`)
}

createPost()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
