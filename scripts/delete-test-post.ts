/**
 * Delete the test markdown post
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

async function deleteTestPost() {
  console.log('Deleting test markdown post...\n')

  const { error } = await supabase
    .from('blog_posts')
    .delete()
    .eq('slug', 'test-markdown-post')

  if (error) {
    console.error('❌ Failed:', error.message)
    process.exit(1)
  }

  console.log('✅ Test post deleted!\n')
}

deleteTestPost()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
