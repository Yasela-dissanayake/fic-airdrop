// We'll use the Supabase JS client library
// Add this to your HTML: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js"></script>

// Initialize Supabase client
// Replace these with your actual Supabase URL and anon key
const SUPABASE_URL = "https://ksepoebysvozqtohxzqz.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzZXBvZWJ5c3ZvenF0b2h4enF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5OTg1MzksImV4cCI6MjA2MDU3NDUzOX0.osKzdNVy2o1Vjr0FJRQQtc1Mfr-Q8mBXmVEJoTh3R8k";

// Create a single supabase client for interacting with your database
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Function to store user in Supabase when wallet is connected
async function storeUserInSupabase() {
  if (!userWalletAddress) return;

  try {
    // Check if user already exists
    const { data: existingUser, error: fetchError } = await supabaseClient
      .from("users")
      .select("*")
      .eq("wallet_address", userWalletAddress)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 is the error code for "no rows returned"
      console.error("Error checking for existing user:", fetchError);
      return;
    }

    if (!existingUser) {
      // User doesn't exist, so create a new one
      const { data, error } = await supabaseClient.from("users").insert([
        {
          wallet_address: userWalletAddress,
          points: 0,
          tasks_completed: 0,
          joined_date: new Date(),
        },
      ]);

      if (error) {
        console.error("Error creating new user:", error);
        return;
      }

      console.log("New user created in Supabase:", data);
    } else {
      console.log("User already exists in Supabase:", existingUser);
    }

    // Dispatch event that user data is ready
    const userDataEvent = new CustomEvent("userDataReady", {
      detail: { address: userWalletAddress },
    });
    document.dispatchEvent(userDataEvent);
  } catch (error) {
    console.error("Error in Supabase user operations:", error);
  }
}

// Function to get user data from Supabase
async function getUserData() {
  if (!userWalletAddress) return null;

  try {
    const { data, error } = await supabaseClient
      .from("users")
      .select("*")
      .eq("wallet_address", userWalletAddress)
      .single();

    if (error) {
      console.error("Error fetching user data:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error getting user data:", error);
    return null;
  }
}

// Function to update user points after completing a task
async function updateUserPoints(taskPoints) {
  if (!userWalletAddress) return false;

  try {
    // Get current user data
    const userData = await getUserData();
    if (!userData) return false;

    // Update user data with new points
    const newPoints = userData.points + taskPoints;
    const newTasksCompleted = userData.tasks_completed + 1;

    const { data, error } = await supabaseClient
      .from("users")
      .update({
        points: newPoints,
        tasks_completed: newTasksCompleted,
      })
      .eq("wallet_address", userWalletAddress);

    if (error) {
      console.error("Error updating user points:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in updating user points:", error);
    return false;
  }
}

// Function to log task completion
async function logTaskCompletion(taskId, taskName, pointsEarned) {
  if (!userWalletAddress) return false;

  try {
    const { data, error } = await supabaseClient
      .from("task_completions")
      .insert([
        {
          user_wallet: userWalletAddress,
          task_id: taskId,
          task_name: taskName,
          points_earned: pointsEarned,
          completed_at: new Date(),
        },
      ]);

    if (error) {
      console.error("Error logging task completion:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in logging task:", error);
    return false;
  }
}

// Function to get all available tasks
async function getAllTasks() {
  try {
    const { data, error } = await supabaseClient
      .from("tasks")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error("Error fetching tasks:", error);
      return [];
    }

    return data;
  } catch (error) {
    console.error("Error getting tasks:", error);
    return [];
  }
}

// Function to get completed tasks for current user
async function getUserCompletedTasks() {
  if (!userWalletAddress) return [];

  try {
    const { data, error } = await supabaseClient
      .from("task_completions")
      .select("task_id")
      .eq("user_wallet", userWalletAddress);

    if (error) {
      console.error("Error fetching completed tasks:", error);
      return [];
    }

    // Extract task IDs
    return data.map((item) => item.task_id);
  } catch (error) {
    console.error("Error getting completed tasks:", error);
    return [];
  }
}

// Make functions available to other scripts
window.supabaseUtils = {
  getUserData,
  updateUserPoints,
  logTaskCompletion,
  getAllTasks,
  getUserCompletedTasks,
};
