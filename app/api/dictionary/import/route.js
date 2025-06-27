import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const { entries } = await request.json()
    
    if (!entries || !Array.isArray(entries)) {
      return Response.json({ 
        error: 'Entries must be an array' 
      }, { status: 400 })
    }

    const results = {
      imported: 0,
      skipped: 0,
      errors: 0,
      details: []
    }

    for (const entry of entries) {
  // Map possible variations to DB field names
  const halunder_word = entry.halunder_word || entry.halunderWord;
  const german_word = entry.german_word || entry.germanMeaning;

  try {
    // Validate required fields
    if (!halunder_word || !german_word) {
      results.skipped++
      results.details.push({
        word: halunder_word || 'unknown',
        reason: 'Missing required fields'
      })
      continue
    }

    // Check if entry already exists
    const { data: existing } = await supabase
      .from('dictionary_entries')
      .select('id')
      .eq('halunder_word', halunder_word)
      .single()

    if (existing) {
      results.skipped++
      results.details.push({
        word: halunder_word,
        reason: 'Duplicate entry'
      })
      continue
    }

    // Insert entry using correct field names
    await supabase
      .from('dictionary_entries')
      .insert({
        halunder_word,
        german_word,
        // add other fields as needed, e.g., meanings, etc.
      })

    results.imported++
    results.details.push({
      word: halunder_word,
      status: 'Imported'
    })
  } catch (error) {
    results.errors++
    results.details.push({
      word: halunder_word || 'unknown',
      reason: error.message
    })
  }
}
