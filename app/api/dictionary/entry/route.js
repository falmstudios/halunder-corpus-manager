export async function PUT(request) {
  try {
    const body = await request.json()
    const { id, meanings, ...updateData } = body
    
    // Update main entry
    const { data: entry, error } = await supabase
      .from('dictionary_entries')
      .update({
        halunder_word: updateData.halunder_word,
        german_word: updateData.german_word,
        pronunciation: updateData.pronunciation,
        word_type: updateData.word_type,
        gender: updateData.gender,
        plural_form: updateData.plural_form,
        etymology: updateData.etymology,
        additional_info: updateData.additional_info
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    // Update meanings if provided
    if (meanings && Array.isArray(meanings)) {
      // Delete existing meanings
      await supabase
        .from('dictionary_meanings')
        .delete()
        .eq('entry_id', id)
      
      // Insert new meanings
      const validMeanings = meanings.filter(m => m.text && m.text.trim())
      if (validMeanings.length > 0) {
        const meaningsData = validMeanings.map((m, index) => ({
          entry_id: id,
          meaning_number: index + 1,
          german_meaning: m.text.trim(),
          context: m.context,
          meaning_order: index
        }))
        
        await supabase
          .from('dictionary_meanings')
          .insert(meaningsData)
      }
    }
    
    return Response.json({ entry })
    
  } catch (error) {
    console.error('Dictionary update error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
