const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  "https://dugsuqzamzsfsglbkddl.supabase.co",
  "sb_publishable_eElpYQSInjgsaZQVX1b_gA_4ZSRO4qC",
);

async function check() {
  const { data, error } = await supabase.from("products").select("*").limit(1);
  console.log("Products:", data);
  if (error) console.error("Error:", error.message);
  
  const { data: d2, error: e2 } = await supabase.from("orders").select("*").limit(1);
  console.log("Orders:", d2);
  if (e2) console.error("Error:", e2.message);
}
check();
