import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[v0] Fetching event detail for ID:', params.id)
    
    let supabase
    try {
      supabase = await createServerClient()
      console.log('[v0] Supabase client created successfully')
    } catch (clientError) {
      console.error('[v0] Error creating Supabase client:', clientError)
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 })
    }
    
    console.log('[v0] Querying events table...')
    const { data: event, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', params.id)
      .single()
    
    if (error) {
      console.error('[v0] Supabase query error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    if (!event) {
      console.log('[v0] Event not found for ID:', params.id)
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    
    console.log('[v0] Event fetched successfully:', event.title)
    return NextResponse.json(event)
  } catch (error) {
    console.error('[v0] Error fetching event:', error)
    console.error('[v0] Error type:', typeof error)
    console.error('[v0] Error message:', error instanceof Error ? error.message : String(error))
    console.error('[v0] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
