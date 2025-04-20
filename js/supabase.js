const SUPABASE_URL = "https://ksepoebysvozqtohxzqz.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzZXBvZWJ5c3ZvenF0b2h4enF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5OTg1MzksImV4cCI6MjA2MDU3NDUzOX0.osKzdNVy2o1Vjr0FJRQQtc1Mfr-Q8mBXmVEJoTh3R8k";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// store user in Supabase 
async function storeUserInSupabase() {
  if (!userWalletAddress) return;

  try {
    const { data: existingUser, error: fetchError } = await supabaseClient
      .from("users")
      .select("*")
      .eq("wallet_address", userWalletAddress)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") { // "no rows returned" error in supabase
      console.error("Error checking for existing user:", fetchError);
      return;
    }

    if (!existingUser) {
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

// update user points after completing a task
async function updateUserPoints(taskPoints) {
  if (!userWalletAddress) return false;

  try {
    const userData = await getUserData();
    if (!userData) return false;

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

//log task completion
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

//get all available tasks
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

//get completed tasks for current user
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

    return data.map((item) => item.task_id);
  } catch (error) {
    console.error("Error getting completed tasks:", error);
    return [];
  }
}

window.supabaseUtils = {
  getUserData,
  updateUserPoints,
  logTaskCompletion,
  getAllTasks,
  getUserCompletedTasks,
};
