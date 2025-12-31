/**
 * Create a test blog post with simple markdown
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const testPost = {
  slug: "test-markdown-post",
  title: "Test Markdown Post",
  excerpt: "A simple test post to verify markdown rendering is working correctly.",
  cover_image: "/makerslounge-photos/coffee-chat.jpeg",
  content: `# Test Markdown Post

This is a test post to verify markdown rendering.

## Introduction

This is a paragraph with **bold text** and *italic text*. Here's a link to [Google](https://google.com).

## Heading Level 2

This is another paragraph. It should have proper spacing above and below.

### Heading Level 3

Here's a list:

- First item
- Second item
- Third item with **bold text**

#### Heading Level 4

Here's a numbered list:

1. First numbered item
2. Second numbered item
3. Third numbered item

## Code and Quotes

Here's some inline \`code\` in a sentence.

> This is a blockquote. It should have a colored left border and background.
> It can span multiple lines.

Here's a code block:

\`\`\`javascript
function hello() {
  console.log("Hello, world!");
}
\`\`\`

## Tables

| Feature | Status |
|---------|--------|
| Headings | ✓ |
| Lists | ✓ |
| Code | ✓ |

---

That's the end of the test post!
`,
  tags: ["Test", "Markdown"],
  read_time_minutes: 2,
  is_published: true,
  is_featured: false,
  published_at: new Date().toISOString(),
  author_id: '4bf42cee-a293-4cb8-a979-d80e0f81644e'
}

async function createTestPost() {
  console.log('Creating test blog post...\n')

  // Check if post exists
  const { data: existing } = await supabase
    .from('blog_posts')
    .select('slug')
    .eq('slug', testPost.slug)
    .single()

  if (existing) {
    console.log('⚠️  Test post already exists. Deleting...')
    await supabase.from('blog_posts').delete().eq('slug', testPost.slug)
  }

  // Insert the post
  const { data, error } = await supabase
    .from('blog_posts')
    .insert(testPost)
    .select()
    .single()

  if (error) {
    console.error('❌ Failed:', error.message)
    process.exit(1)
  }

  console.log('✅ Test post created!')
  console.log(`   View at: http://localhost:3000/blog/${data.slug}\n`)
}

createTestPost()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
