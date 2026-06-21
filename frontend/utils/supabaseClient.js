import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://dugsuqzamzsfsglbkddl.supabase.co";
const SUPABASE_PUBLIC_KEY = "sb_publishable_eElpYQSInjgsaZQVX1b_gA_4ZSRO4qC";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
