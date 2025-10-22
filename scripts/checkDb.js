const { createClient } = require('@supabase/supabase-js');

// Your Supabase credentials
const supabaseUrl = 'https://hnoepzcsrtyqahjyzemg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhub2VwemNzcnR5cWFoanl6ZW1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5NjMyOTAsImV4cCI6MjA3NjUzOTI5MH0.ghy2B41-9g24MSPoBF2equQjnJGq6p58uxBqwIqeVCc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log('🔍 Checking ZapSplit Database Tables...\n');
  console.log('='.repeat(70));

  const tablesToCheck = [
    'profiles',
    'splits',
    'split_participants',
    'friendships',
    'transactions',
    'payments',
    'groups',
    'group_members',
    'split_items',
    'item_assignments'
  ];

  const results = {};

  for (const table of tablesToCheck) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        results[table] = { exists: false, error: error.message };
      } else {
        results[table] = { exists: true, count: count || 0 };
      }
    } catch (err) {
      results[table] = { exists: false, error: 'Unknown error' };
    }
  }

  // Display results
  console.log('\n📊 Table Status:\n');

  Object.keys(results).forEach(table => {
    const { exists, count, error } = results[table];

    if (exists) {
      console.log(`✅ ${table.padEnd(25)} | ${count} rows`);
    } else {
      console.log(`❌ ${table.padEnd(25)} | Missing`);
    }
  });

  console.log('\n' + '='.repeat(70));

  const existingTables = Object.keys(results).filter(t => results[t].exists);
  const missingTables = Object.keys(results).filter(t => !results[t].exists);

  console.log(`\n✅ Existing: ${existingTables.length}/${Object.keys(results).length} tables`);

  if (missingTables.length > 0) {
    console.log(`\n❌ Missing tables: ${missingTables.join(', ')}`);
    console.log('\n💡 These tables need to be created in Supabase.');
  } else {
    console.log('\n🎉 All required tables exist!');
  }

  // Check for Phase 1 specific tables
  const phase1Tables = ['splits', 'split_participants', 'friendships', 'transactions'];
  const phase1Existing = phase1Tables.filter(t => results[t]?.exists);

  console.log(`\n📋 Phase 1 Tables: ${phase1Existing.length}/${phase1Tables.length}`);
  phase1Tables.forEach(t => {
    console.log(`   ${results[t]?.exists ? '✅' : '❌'} ${t}`);
  });

  return results;
}

checkTables()
  .then(() => {
    console.log('\n✅ Database check complete!');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Error:', err);
    process.exit(1);
  });
