/**
 * Create the MakersLounge #10 Claude Code Workshop recap blog post.
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

import { upsertPostBySlug } from './lib/blog-post-db'

// Only Next.js loads .env.local automatically; a script has to ask.
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

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

  // Replaces any post already at this slug, so the script is re-runnable.
  await upsertPostBySlug(newPost)

  console.log('✅ Blog post published!')
  console.log(`   Title: ${newPost.title}`)
  console.log(`   Slug: ${newPost.slug}`)
  console.log(`   Featured: ${newPost.is_featured}`)
  console.log(`   Tags: ${(newPost.tags ?? []).join(', ')}`)
  console.log(`   Read time: ${newPost.read_time_minutes} minutes`)
  console.log(`\n   Live at: https://makerslounge.ca/blog/${newPost.slug}`)
  console.log(`   Edit at: https://makerslounge.ca/admin/blog (find it in the list)\n`)
}

createPost()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
