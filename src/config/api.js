import axios from "axios";

// API Configuration
const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api",
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || "http://localhost:8080",
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle token expiry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/?tab=login";
      return Promise.reject(error);
    }

    // Retry logic for network errors
    if (
      !error.response &&
      originalRequest &&
      !originalRequest._retry &&
      originalRequest._retryCount < API_CONFIG.RETRY_ATTEMPTS
    ) {
      originalRequest._retry = true;
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

      await new Promise((resolve) =>
        setTimeout(
          resolve,
          API_CONFIG.RETRY_DELAY * originalRequest._retryCount
        )
      );

      return apiClient(originalRequest);
    }

    return Promise.reject(error);
  }
);

// API endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    LOGOUT: "/auth/logout",
    PROFILE: "/auth/me",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
  },

  // Game endpoints
  GAMES: {
    LIST: "/game/list",
    POPULAR: "/game/popular",
    CONTINUE: "/game/continue",
    HISTORY: "/game/history",
    STATS: "/game/stats",
    PLACE_BET: "/game/bet",
    FAIRNESS_OVERVIEW: "/casino/fairness/overview",
    FAIRNESS_VERIFY: "/casino/fairness/verify",
    FAIRNESS_SEEDS: "/casino/fairness/seeds",
  },

  // Sports endpoints
  SPORTS: {
    CATALOG: "/sports/catalog",
    EVENTS: "/sports/events",
    BET: "/bets/single",
    BET_HISTORY: "/bets/history",
  },

  // Wallet endpoints
  WALLET: {
    BALANCE: "/wallet/balance",
    ACCOUNTS: "/wallet/accounts",
    DEPOSIT: "/wallet/deposit",
    DEMO_TOP_UP: "/wallet/demo/top-up",
    WITHDRAW: "/wallet/withdraw",
    TRANSACTIONS: "/wallet/transactions",
    LEDGER: "/wallet/ledger",
    CRYPTO_ADDRESSES: "/wallet/crypto/addresses",
    CRYPTO_DEPOSITS: "/wallet/crypto/deposits",
    CRYPTO_SIMULATE: "/wallet/crypto/deposits/simulate",
  },

  ACCOUNT: {
    OVERVIEW: "/account/overview",
    KYC: "/account/kyc",
    RESPONSIBLE_GAMING: "/account/responsible-gaming",
    RESPONSIBLE_GAMING_LIMITS: "/account/responsible-gaming/limits",
    SELF_EXCLUSIONS: "/account/self-exclusions",
  },

  SECURITY: {
    OVERVIEW: "/security/overview",
    SESSIONS: "/security/sessions",
  },

  // Admin endpoints (if applicable)
  ADMIN: {
    USERS: "/admin/users",
    GAMES: "/admin/games",
    TRANSACTIONS: "/admin/transactions",
    SETTINGS: "/admin/settings",
  },
};

// API service functions
export const apiService = {
  // Generic request methods
  get: (endpoint, config = {}) => apiClient.get(endpoint, config),
  post: (endpoint, data = {}, config = {}) =>
    apiClient.post(endpoint, data, config),
  put: (endpoint, data = {}, config = {}) =>
    apiClient.put(endpoint, data, config),
  patch: (endpoint, data = {}, config = {}) =>
    apiClient.patch(endpoint, data, config),
  delete: (endpoint, config = {}) => apiClient.delete(endpoint, config),

  // Auth services
  auth: {
    login: (credentials) =>
      apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials),
    register: (userData) =>
      apiClient.post(API_ENDPOINTS.AUTH.REGISTER, userData),
    logout: () => apiClient.post(API_ENDPOINTS.AUTH.LOGOUT),
    getProfile: () => apiClient.get(API_ENDPOINTS.AUTH.PROFILE),
    forgotPassword: (email) =>
      apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email }),
    resetPassword: (data) =>
      apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, data),
  },

  // Game services
  games: {
    getList: () => apiClient.get(API_ENDPOINTS.GAMES.LIST),
    getPopular: () => apiClient.get(API_ENDPOINTS.GAMES.POPULAR),
    getContinue: () => apiClient.get(API_ENDPOINTS.GAMES.CONTINUE),
    getHistory: (params) =>
      apiClient.get(API_ENDPOINTS.GAMES.HISTORY, { params }),
    getStats: () => apiClient.get(API_ENDPOINTS.GAMES.STATS),
    placeBet: (betData) =>
      apiClient.post(API_ENDPOINTS.GAMES.PLACE_BET, betData),
    getFairnessOverview: () =>
      apiClient.get(API_ENDPOINTS.GAMES.FAIRNESS_OVERVIEW),
    getFairnessSeeds: () => apiClient.get(API_ENDPOINTS.GAMES.FAIRNESS_SEEDS),
    getFairnessCurrentSeed: (gameKey) =>
      apiClient.get(`/casino/fairness/current/${gameKey}`),
    rotateFairnessSeed: (gameKey, data = {}) =>
      apiClient.post(`/casino/fairness/${gameKey}/rotate`, data),
    verifyFairness: (data) =>
      apiClient.post(API_ENDPOINTS.GAMES.FAIRNESS_VERIFY, data),
  },

  // Sports services
  sports: {
    getCatalog: () => apiClient.get(API_ENDPOINTS.SPORTS.CATALOG),
    getEvents: (params) =>
      apiClient.get(API_ENDPOINTS.SPORTS.EVENTS, { params }),
    getLiveEvents: () =>
      apiClient.get(API_ENDPOINTS.SPORTS.EVENTS, { params: { status: "live" } }),
    getEvent: (eventId) => apiClient.get(`${API_ENDPOINTS.SPORTS.EVENTS}/${eventId}`),
    getEventMarkets: (eventId) =>
      apiClient.get(`${API_ENDPOINTS.SPORTS.EVENTS}/${eventId}/markets`),
    placeBet: (betData) => apiClient.post(API_ENDPOINTS.SPORTS.BET, betData),
    getBetHistory: (params) =>
      apiClient.get(API_ENDPOINTS.SPORTS.BET_HISTORY, { params }),
  },

  // Wallet services
  wallet: {
    getBalance: () => apiClient.get(API_ENDPOINTS.WALLET.BALANCE),
    getAccounts: () => apiClient.get(API_ENDPOINTS.WALLET.ACCOUNTS),
    deposit: (amount, method = "upi", provider = "manual") =>
      apiClient.post(API_ENDPOINTS.WALLET.DEPOSIT, {
        amount,
        method,
        provider,
      }),
    topUpDemo: (amount, source = "profile") =>
      apiClient.post(API_ENDPOINTS.WALLET.DEMO_TOP_UP, {
        amount,
        source,
      }),
    withdraw: (amount, method) =>
      apiClient.post(API_ENDPOINTS.WALLET.WITHDRAW, { amount, method }),
    getTransactions: (params) =>
      apiClient.get(API_ENDPOINTS.WALLET.TRANSACTIONS, { params }),
    getLedger: () => apiClient.get(API_ENDPOINTS.WALLET.LEDGER),
    getCryptoAddresses: () =>
      apiClient.get(API_ENDPOINTS.WALLET.CRYPTO_ADDRESSES),
    getCryptoDeposits: (params) =>
      apiClient.get(API_ENDPOINTS.WALLET.CRYPTO_DEPOSITS, { params }),
    simulateCryptoDeposit: (chain, amountCrypto) =>
      apiClient.post(API_ENDPOINTS.WALLET.CRYPTO_SIMULATE, {
        chain,
        amountCrypto,
      }),
  },

  account: {
    getOverview: () => apiClient.get(API_ENDPOINTS.ACCOUNT.OVERVIEW),
    getKycProfile: () => apiClient.get(API_ENDPOINTS.ACCOUNT.KYC),
    updateKycProfile: (data) => apiClient.put(API_ENDPOINTS.ACCOUNT.KYC, data),
    getResponsibleGaming: () =>
      apiClient.get(API_ENDPOINTS.ACCOUNT.RESPONSIBLE_GAMING),
    updateResponsibleGamingLimits: (data) =>
      apiClient.put(API_ENDPOINTS.ACCOUNT.RESPONSIBLE_GAMING_LIMITS, data),
    getSelfExclusions: () =>
      apiClient.get(API_ENDPOINTS.ACCOUNT.SELF_EXCLUSIONS),
    createSelfExclusion: (data) =>
      apiClient.post(API_ENDPOINTS.ACCOUNT.SELF_EXCLUSIONS, data),
  },

  security: {
    getOverview: () => apiClient.get(API_ENDPOINTS.SECURITY.OVERVIEW),
    getSessions: () => apiClient.get(API_ENDPOINTS.SECURITY.SESSIONS),
  },
};

// Error handling utilities
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    return {
      message: data.message || "Server error occurred",
      status,
      data: data.errors || null,
    };
  } else if (error.request) {
    // Network error
    return {
      message: "Network error. Please check your connection.",
      status: 0,
      data: null,
    };
  } else {
    // Other error
    return {
      message: error.message || "An unexpected error occurred",
      status: 0,
      data: null,
    };
  }
};

export { apiClient, API_CONFIG };
export default apiService;
