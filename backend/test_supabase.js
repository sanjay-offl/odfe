const { createClient } = require("@supabase/supabase-js");

class MockWebSocket {}
global.WebSocket = MockWebSocket;

const supabase = createClient(
  "https://fapedpvjzfiudlaujgai.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhcGVkcHZqemZpdWRsYXVqZ2FpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTk0ODI5OCwiZXhwIjoyMDk3NTI0Mjk4fQ.J-C1hPVZI5kXl9DuN_bIp_JVYUT0VsRSpZ_DzXQ5eys",
);

async function check() {
  const { data, error } = await supabase.from("users").select("*").limit(1);
  console.log("Users:", data);
  if (error) console.error("Error:", error.message);
}

check();
