let userWalletAddress = null;
let web3 = null;
let provider = null;

// DOM elements
const connectWalletBtn = document.getElementById("connectWallet");
const walletAddressDisplay = document.getElementById("walletAddress");

// Initialize wallet connection
async function initWallet() {
  if (window.ethereum) {
    try {
      // Modern dapp browsers
      provider = new ethers.providers.Web3Provider(window.ethereum);

      // Check if already connected
      const accounts = await provider.listAccounts();
      if (accounts.length > 0) {
        userWalletAddress = accounts[0];
        updateWalletUI();
        storeUserInSupabase();
      }

      // Set up event listener for wallet button
      connectWalletBtn.addEventListener("click", connectWallet);

      // Handle account change event
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
          userWalletAddress = accounts[0];
          updateWalletUI();
          storeUserInSupabase();
        } else {
          userWalletAddress = null;
          resetWalletUI();
        }
      });
    } catch (error) {
      console.error("Error initializing wallet:", error);
    }
  } else {
    // If no web3 provider is available
    console.log("No Ethereum browser extension detected");
    connectWalletBtn.textContent = "Install MetaMask";
    connectWalletBtn.addEventListener("click", () => {
      window.open("https://metamask.io/download.html", "_blank");
    });
  }
}

// Connect wallet function
async function connectWallet() {
  try {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    userWalletAddress = accounts[0];
    updateWalletUI();
    storeUserInSupabase();

    return true;
  } catch (error) {
    console.error("Error connecting wallet:", error);
    return false;
  }
}

// Update UI after successful connection
function updateWalletUI() {
  // Format the address for display (first 6 and last 4 characters)
  const formattedAddress = `${userWalletAddress.substring(
    0,
    6
  )}...${userWalletAddress.substring(userWalletAddress.length - 4)}`;

  connectWalletBtn.textContent = "Connected";
  connectWalletBtn.disabled = true;
  connectWalletBtn.classList.add("connected");

  // Show address display
  walletAddressDisplay.textContent = formattedAddress;
  walletAddressDisplay.style.display = "block";

  // Store wallet address in session storage for use across pages
  sessionStorage.setItem("walletAddress", userWalletAddress);

  // Dispatch event that wallet is connected
  const walletConnectedEvent = new CustomEvent("walletConnected", {
    detail: { address: userWalletAddress },
  });
  document.dispatchEvent(walletConnectedEvent);
}

// Reset UI when wallet disconnected
function resetWalletUI() {
  connectWalletBtn.textContent = "Connect Wallet";
  connectWalletBtn.disabled = false;
  connectWalletBtn.classList.remove("connected");

  walletAddressDisplay.style.display = "none";

  // Clear session storage
  sessionStorage.removeItem("walletAddress");
}

// Check if already connected (page reload)
function checkExistingConnection() {
  const savedAddress = sessionStorage.getItem("walletAddress");
  if (savedAddress) {
    userWalletAddress = savedAddress;
    updateWalletUI();
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  initWallet();
  checkExistingConnection();
});

// Function to check if wallet is connected (used by other scripts)
function isWalletConnected() {
  return userWalletAddress !== null;
}

// Make functions available to other scripts
window.walletUtils = {
  isWalletConnected,
  connectWallet,
  getCurrentWalletAddress: () => userWalletAddress,
};
