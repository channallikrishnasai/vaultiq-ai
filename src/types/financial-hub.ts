// ── Net Worth Engine Types ──────────────────────────────────────────────────

export interface AssetEntry {
  id: string;
  name: string;
  type: AssetType;
  value: number;
  institution?: string;
  accountNumber?: string;
  lastSynced?: string;
  metadata?: Record<string, unknown>;
}

export type AssetType =
  | "cash"
  | "bank_savings"
  | "bank_current"
  | "mutual_fund"
  | "stock"
  | "crypto"
  | "property"
  | "fixed_deposit"
  | "ppf"
  | "nps"
  | "gold"
  | "other";

export interface LiabilityEntry {
  id: string;
  name: string;
  type: LiabilityType;
  balance: number;
  limit?: number;
  interestRate?: number;
  emi?: number;
  institution?: string;
  dueDate?: string;
  metadata?: Record<string, unknown>;
}

export type LiabilityType =
  | "home_loan"
  | "personal_loan"
  | "education_loan"
  | "car_loan"
  | "credit_card"
  | "gold_loan"
  | "business_loan"
  | "other";

export interface NetWorthSnapshot {
  timestamp: string;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  assets: AssetEntry[];
  liabilities: LiabilityEntry[];
  breakdown: {
    assetByType: { type: AssetType; value: number; percent: number }[];
    liabilityByType: { type: LiabilityType; balance: number; percent: number }[];
  };
}

export interface NetWorthTrend {
  date: string;
  netWorth: number;
  assets: number;
  liabilities: number;
}

// ── Bank Aggregation Types ─────────────────────────────────────────────────

export type BankConnectionStatus = "connected" | "disconnected" | "error" | "syncing";

export interface BankAccount {
  id: string;
  bankId: string;
  bankName: string;
  accountNumber: string;
  accountType: BankAccountType;
  balance: number;
  currency: string;
  lastSynced: string;
  status: BankConnectionStatus;
  institution?: string;
}

export type BankAccountType =
  | "savings"
  | "current"
  | "fixed_deposit"
  | "recurring_deposit"
  | "nre"
  | "nro";

export interface BankTransaction {
  id: string;
  accountId: string;
  date: string;
  description: string;
  amount: number;
  type: "credit" | "debit";
  category?: string;
  balance?: number;
}

export interface BankProvider {
  id: string;
  name: string;
  connect(userId: string, credentials: BankCredentials): Promise<BankConnection>;
  disconnect(connectionId: string): Promise<void>;
  getAccounts(connectionId: string): Promise<BankAccount[]>;
  getTransactions(connectionId: string, accountId: string, from?: string, to?: string): Promise<BankTransaction[]>;
  sync(connectionId: string): Promise<BankSyncResult>;
  getStatus(connectionId: string): Promise<BankConnectionStatus>;
}

export interface BankCredentials {
  bankId: string;
  consent: boolean;
  [key: string]: unknown;
}

export interface BankConnection {
  id: string;
  userId: string;
  bankId: string;
  status: BankConnectionStatus;
  createdAt: string;
}

export interface BankSyncResult {
  accounts: BankAccount[];
  transactions: BankTransaction[];
  syncedAt: string;
}

// ── Universal Search Types ─────────────────────────────────────────────────

export type SearchEntityType =
  | "transaction"
  | "goal"
  | "budget"
  | "document"
  | "stock"
  | "mutual_fund"
  | "portfolio"
  | "alert"
  | "conversation"
  | "bill"
  | "income"
  | "expense";

export interface SearchFilters {
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  category?: string;
  entityType?: SearchEntityType[];
}

export interface SearchResult {
  id: string;
  entityType: SearchEntityType;
  title: string;
  subtitle: string;
  value?: number;
  date?: string;
  icon: string;
  color: string;
  relevance: number;
  data?: Record<string, unknown>;
}

export interface SearchResponse {
  results: SearchResult[];
  grouped: Record<SearchEntityType, SearchResult[]>;
  total: number;
  query: string;
  filters?: SearchFilters;
}

// ── Action Agent Types ─────────────────────────────────────────────────────

export type ActionType =
  | "create_goal"
  | "edit_goal"
  | "delete_goal"
  | "create_budget"
  | "edit_budget"
  | "delete_budget"
  | "create_alert"
  | "delete_alert"
  | "add_watchlist"
  | "remove_watchlist"
  | "upload_document"
  | "generate_report"
  | "create_virtual_trade"
  | "update_profile";

export type ActionStatus =
  | "pending_confirmation"
  | "confirmed"
  | "executing"
  | "completed"
  | "failed"
  | "undone";

export interface ActionRequest {
  id: string;
  userId: string;
  type: ActionType;
  params: Record<string, unknown>;
  source: "chat" | "voice" | "ui";
  createdAt: string;
}

export interface ActionPreview {
  actionType: ActionType;
  description: string;
  impact: string;
  reversible: boolean;
  params: Record<string, unknown>;
}

export interface ActionResult {
  actionId: string;
  status: ActionStatus;
  data?: Record<string, unknown>;
  error?: string;
  undoneAt?: string;
}

export interface ActionConfirmation {
  actionId: string;
  confirmed: boolean;
  userId: string;
}

// ── Tool Registry Types ────────────────────────────────────────────────────

export interface ToolParameter {
  name: string;
  type: "string" | "number" | "boolean" | "object" | "array";
  description: string;
  required: boolean;
  enum?: string[];
  default?: unknown;
}

export interface ToolDefinition {
  name: string;
  description: string;
  category: ToolCategory;
  parameters: ToolParameter[];
  execute: (params: Record<string, unknown>, userId: string) => Promise<ToolResult>;
  requiresConfirmation: boolean;
  sensitive: boolean;
}

export type ToolCategory =
  | "financial"
  | "goal"
  | "budget"
  | "market"
  | "document"
  | "prediction"
  | "portfolio"
  | "alert"
  | "watchlist"
  | "profile";

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
  message?: string;
}

// ── Voice Types ────────────────────────────────────────────────────────────

export interface VoiceConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
}

export interface VoiceTranscript {
  text: string;
  confidence: number;
  isFinal: boolean;
  alternatives?: { text: string; confidence: number }[];
}

export interface VoiceResponse {
  text: string;
  audio?: Blob;
  timestamp: string;
}

// ── Memory Types ───────────────────────────────────────────────────────────

export interface ConversationTurn {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  context?: ConversationContext;
  actionId?: string;
}

export interface ConversationContext {
  topic: string;
  entities: { type: string; value: string }[];
  sentiment?: "positive" | "negative" | "neutral";
}

export interface ConversationSession {
  id: string;
  userId: string;
  turns: ConversationTurn[];
  startedAt: string;
  lastActiveAt: string;
  summary?: string;
}

export interface MemoryEntry {
  key: string;
  value: string;
  context: string;
  createdAt: string;
  expiresAt?: string;
}

// ── Audit Log Types ────────────────────────────────────────────────────────

export interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// ── Financial Hub Types ────────────────────────────────────────────────────

export interface FinancialHubData {
  netWorth: NetWorthSnapshot;
  bankAccounts: BankAccount[];
  recentTransactions: BankTransaction[];
  searchSuggestions: string[];
  quickActions: QuickAction[];
  agentActivity: AgentActivity[];
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  action: ActionType;
  params?: Record<string, unknown>;
}

export interface AgentActivity {
  id: string;
  type: ActionType;
  description: string;
  status: ActionStatus;
  timestamp: string;
}
