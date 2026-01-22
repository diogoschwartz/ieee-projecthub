import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zrjrrxszapdtpfsvwedb.supabase.co';
const supabaseKey = 'sb_publishable_TYBdU9wZfp7RohgablUQOA_2_hxYZh7';

export const supabase = createClient(supabaseUrl, supabaseKey);