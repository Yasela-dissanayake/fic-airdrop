// Task related functionality

// Sample tasks if not using Supabase yet
const sampleTasks = [
  {
    id: 1,
    name: "Follow on Twitter",
    description: "Follow FIC Project on Twitter",
    points: 50,
    action_url: "https://twitter.com/ficproject",
    verification_type: "manual",
  },
  {
    id: 2,
    name: "Join Discord",
    description: "Join our Discord server community",
    points: 75,
    action_url: "https://discord.gg/ficproject",
    verification_type: "manual",
  },
  {
    id: 3,
    name: "Share on Twitter",
    description: "Share about FIC Airdrop on your Twitter profile",
    points: 100,
    action_url:
      "https://twitter.com/intent/tweet?text=I'm%20earning%20$FIC%20tokens%20through%20the%20airdrop%20program!%20Join%20me%20at%20https://ficairdrop.com",
    verification_type: "manual",
  },
  {
    id: 4,
    name: "Daily Check-in",
    description: "Check in daily to earn points",
    points: 25,
    action_url: "#",
    verification_type: "automatic",
  },
];

// Variables
let tasks = [];
let completedTaskIds = [];
let userData = null;

// Initialize tasks
async function initTasks() {
  // This function will handle loading tasks when the Earn page loads
  if (!window.walletUtils || !window.walletUtils.isWalletConnected()) {
    displayWalletRequiredMessage();
    return;
  }

  showLoadingState();

  try {
    // Try to get tasks from Supabase
    tasks = await window.supabaseUtils.getAllTasks();

    // If no tasks from Supabase, use sample tasks
    if (!tasks || tasks.length === 0) {
      tasks = sampleTasks;
    }

    // Get user's completed tasks
    completedTaskIds = await window.supabaseUtils.getUserCompletedTasks();

    // Get user data
    userData = await window.supabaseUtils.getUserData();

    // Display tasks and user stats
    displayTasks();
    displayUserStats();
  } catch (error) {
    console.error("Error initializing tasks:", error);
    tasks = sampleTasks; // Fallback to sample tasks
    displayTasks();
  }

  hideLoadingState();
}

// Display tasks on the page
function displayTasks() {
  const taskListElement = document.getElementById("taskList");
  if (!taskListElement) return;

  taskListElement.innerHTML = "";

  tasks.forEach((task) => {
    const isCompleted = completedTaskIds.includes(task.id);

    const taskElement = document.createElement("div");
    taskElement.className = `task-item ${isCompleted ? "completed" : ""}`;

    taskElement.innerHTML = `
          <div class="task-info">
              <h3>${task.name}</h3>
              <p>${task.description}</p>
          </div>
          <div class="task-points">
              ${task.points} points
          </div>
          <div class="task-action">
              <button 
                  data-task-id="${task.id}" 
                  data-task-name="${task.name}" 
                  data-task-points="${task.points}"
                  data-action-url="${task.action_url}"
                  data-verification="${task.verification_type}"
                  ${isCompleted ? "disabled" : ""}
              >
                  ${isCompleted ? "Completed" : "Complete Task"}
              </button>
          </div>
      `;

    taskListElement.appendChild(taskElement);

    // Add event listener to the button
    const button = taskElement.querySelector("button");
    if (!isCompleted) {
      button.addEventListener("click", handleTaskAction);
    }
  });
}

// Handle task action button click
async function handleTaskAction(event) {
  const button = event.currentTarget;
  const taskId = parseInt(button.dataset.taskId);
  const taskName = button.dataset.taskName;
  const taskPoints = parseInt(button.dataset.taskPoints);
  const actionUrl = button.dataset.actionUrl;
  const verificationType = button.dataset.verification;

  // For tasks that require external action
  if (actionUrl !== "#") {
    window.open(actionUrl, "_blank");
  }

  // For automatic verification tasks
  if (verificationType === "automatic") {
    await completeTask(taskId, taskName, taskPoints, button);
  } else {
    // For manual verification, show confirmation dialog
    showVerificationDialog(taskId, taskName, taskPoints, button);
  }
}

// Show verification dialog for manual tasks
function showVerificationDialog(taskId, taskName, taskPoints, button) {
  // Create a simple modal dialog
  const modal = document.createElement("div");
  modal.className = "verification-modal";
  modal.innerHTML = `
      <div class="modal-content">
          <h3>Verify Task Completion</h3>
          <p>Did you complete the "${taskName}" task?</p>
          <div class="modal-actions">
              <button id="confirmTask">Yes, I completed it</button>
              <button id="cancelTask">Cancel</button>
          </div>
      </div>
  `;

  document.body.appendChild(modal);

  // Add event listeners
  document.getElementById("confirmTask").addEventListener("click", async () => {
    document.body.removeChild(modal);
    await completeTask(taskId, taskName, taskPoints, button);
  });

  document.getElementById("cancelTask").addEventListener("click", () => {
    document.body.removeChild(modal);
  });
}

// Complete task and update points
async function completeTask(taskId, taskName, taskPoints, button) {
  if (!window.walletUtils.isWalletConnected()) {
    alert("Please connect your wallet first");
    return;
  }

  button.disabled = true;
  button.textContent = "Processing...";

  try {
    // Update points in Supabase
    const pointsUpdated = await window.supabaseUtils.updateUserPoints(
      taskPoints
    );

    // Log task completion
    const taskLogged = await window.supabaseUtils.logTaskCompletion(
      taskId,
      taskName,
      taskPoints
    );

    if (pointsUpdated && taskLogged) {
      // Update UI
      button.textContent = "Completed";
      completedTaskIds.push(taskId);

      // Refresh user stats
      userData = await window.supabaseUtils.getUserData();
      displayUserStats();

      // Show success message
      showNotification(`Task completed! You earned ${taskPoints} points.`);
    } else {
      button.disabled = false;
      button.textContent = "Complete Task";
      showNotification("Error completing task. Please try again.", "error");
    }
  } catch (error) {
    console.error("Error completing task:", error);
    button.disabled = false;
    button.textContent = "Complete Task";
    showNotification("Error completing task. Please try again.", "error");
  }
}

// Display user stats
function displayUserStats() {
  const statsElement = document.getElementById("userStats");
  if (!statsElement || !userData) return;

  statsElement.innerHTML = `
      <div class="stats-grid">
          <div class="stat-card">
              <div class="stat-value">${userData.points}</div>
              <div class="stat-label">Total Points</div>
          </div>
          <div class="stat-card">
              <div class="stat-value">${userData.tasks_completed}</div>
              <div class="stat-label">Tasks Completed</div>
          </div>
          <div class="stat-card">
              <div class="stat-value">${Math.floor(userData.points / 100)}</div>
              <div class="stat-label">FIC Tokens Earned</div>
          </div>
      </div>
  `;
}

// Display message when wallet connection is required
function displayWalletRequiredMessage() {
  const taskListElement = document.getElementById("taskList");
  if (!taskListElement) return;

  taskListElement.innerHTML = `
      <div class="wallet-required">
          <h3>Connect Your Wallet</h3>
          <p>Please connect your wallet to view and complete tasks.</p>
          <button id="connectWalletTask">Connect Wallet</button>
      </div>
  `;

  // Add event listener to the button
  document
    .getElementById("connectWalletTask")
    .addEventListener("click", async () => {
      const connected = await window.walletUtils.connectWallet();
      if (connected) {
        initTasks();
      }
    });
}

// Show loading state
function showLoadingState() {
  const taskListElement = document.getElementById("taskList");
  if (!taskListElement) return;

  taskListElement.innerHTML = `
    <div class="loading-state">
            <p>Loading tasks...</p>
        </div>
    `;
}

// Hide loading state
function hideLoadingState() {
  // Loading state is replaced when displaying tasks
}

// Show notification
function showNotification(message, type = "success") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  // Auto remove after 3 seconds
  setTimeout(() => {
    document.body.removeChild(notification);
  }, 3000);
}

// Initialize when DOM is loaded on the earn page
document.addEventListener("DOMContentLoaded", function () {
  // Check if we're on the earn page
  if (document.getElementById("taskList")) {
    // Wait for wallet connection
    if (window.walletUtils && window.walletUtils.isWalletConnected()) {
      initTasks();
    } else {
      displayWalletRequiredMessage();

      // Listen for wallet connected event
      document.addEventListener("walletConnected", function () {
        initTasks();
      });
    }
  }
});
