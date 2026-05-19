import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyslautcpyzoeebpjihy.supabase.co';
const supabaseAnonKey = 'sb_publishable_zsT5r6UF9w4MUC0gOEL0bg_Shn4RtMU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkCols() {
  const cols = ['current_amount', 'status', 'is_completed', 'created_at', 'deadline', 'order', 'step', 'allocated', 'description', 'id'];
  for (const col of cols) {
    const { error } = await supabase.from('milestones').select(col).limit(1);
    if (!error) {
      console.log(`Column EXISTS: ${col}`);
    } else {
      console.log(`Column missing: ${col} (${error.message})`);
    }
  }
}

checkCols();
