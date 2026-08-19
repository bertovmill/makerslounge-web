/**
 * Delete the test markdown post
 */

import * as dotenv from 'dotenv'
import * as path from 'path'

import { upsertPostBySlug, deletePostBySlug } from './lib/blog-post-db'

// Only Next.js loads .env.local automatically; a script has to ask.
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

async function deleteTestPost() {
  console.log('Deleting test markdown post...\n')

  const removed = await deletePostBySlug('test-markdown-post')

  console.log(removed > 0 ? '✅ Test post deleted!\n' : 'ℹ️  No test post to delete.\n')
}

deleteTestPost()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
