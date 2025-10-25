import { supabase } from '../services/supabase'

/**
 * Check what tables exist in the database and their structure
 */
export async function checkDatabaseTables() {
  console.log('🔍 Checking database tables...\n')

  const tablesToCheck = [
    'profiles',
    'splits',
    'split_participants',
    'friendships',
    'transactions',
    'payments',
    'groups',
    'group_members'
  ]

  const results: any = {}

  for (const table of tablesToCheck) {
    try {
      // Try to count rows in the table
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })

      if (error) {
        results[table] = { exists: false, error: error.message }
      } else {
        results[table] = { exists: true, count: count || 0 }
      }
    } catch (err) {
      results[table] = { exists: false, error: 'Unknown error' }
    }
  }

  return results
}

/**
 * Display database check results
 */
export function displayDatabaseResults(results: any) {
  console.log('📊 Database Table Status:\n')
  console.log('━'.repeat(60))

  Object.keys(results).forEach(table => {
    const { exists, count, error } = results[table]

    if (exists) {
      console.log(`✅ ${table.padEnd(25)} | ${count} rows`)
    } else {
      console.log(`❌ ${table.padEnd(25)} | ${error}`)
    }
  })

  console.log('━'.repeat(60))

  const existingTables = Object.keys(results).filter(t => results[t].exists)
  const missingTables = Object.keys(results).filter(t => !results[t].exists)

  console.log(`\n✅ Existing: ${existingTables.length}/${Object.keys(results).length}`)
  if (missingTables.length > 0) {
    console.log(`❌ Missing: ${missingTables.join(', ')}`)
  }
}

/**
 * Run the complete database check
 */
export async function runDatabaseCheck() {
  try {
    const results = await checkDatabaseTables()
    displayDatabaseResults(results)
    return results
  } catch (error) {
    console.error('❌ Database check failed:', error)
    throw error
  }
}
