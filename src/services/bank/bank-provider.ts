import type {
  BankProvider,
  BankCredentials,
  BankConnection,
  BankAccount,
  BankTransaction,
  BankSyncResult,
  BankConnectionStatus,
} from "@/types/financial-hub";

// ── Provider Registry ──────────────────────────────────────────────────────

const providers = new Map<string, BankProvider>();

export function registerBankProvider(provider: BankProvider): void {
  providers.set(provider.id, provider);
}

export function getBankProvider(bankId: string): BankProvider | undefined {
  return providers.get(bankId);
}

export function getAllBankProviders(): BankProvider[] {
  return Array.from(providers.values());
}

// ── Default Stub Provider ──────────────────────────────────────────────────

class StubBankProvider implements BankProvider {
  id: string;
  name: string;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  async connect(_userId: string, _credentials: BankCredentials): Promise<BankConnection> {
    return {
      id: `conn_${Date.now()}`,
      userId: _credentials.bankId,
      bankId: this.id,
      status: "connected",
      createdAt: new Date().toISOString(),
    };
  }

  async disconnect(_connectionId: string): Promise<void> {
    // Stub: would call bank API
  }

  async getAccounts(_connectionId: string): Promise<BankAccount[]> {
    return [];
  }

  async getTransactions(
    _connectionId: string,
    _accountId: string,
    _from?: string,
    _to?: string,
  ): Promise<BankTransaction[]> {
    return [];
  }

  async sync(_connectionId: string): Promise<BankSyncResult> {
    return {
      accounts: [],
      transactions: [],
      syncedAt: new Date().toISOString(),
    };
  }

  async getStatus(_connectionId: string): Promise<BankConnectionStatus> {
    return "disconnected";
  }
}

// ── Initialize Default Providers ───────────────────────────────────────────

const DEFAULT_BANKS = [
  { id: "hdfc", name: "HDFC Bank" },
  { id: "icici", name: "ICICI Bank" },
  { id: "sbi", name: "State Bank of India" },
  { id: "axis", name: "Axis Bank" },
  { id: "kotak", name: "Kotak Mahindra Bank" },
  { id: "yes", name: "Yes Bank" },
  { id: "pnb", name: "Punjab National Bank" },
  { id: "bob", name: "Bank of Baroda" },
];

for (const bank of DEFAULT_BANKS) {
  registerBankProvider(new StubBankProvider(bank.id, bank.name));
}

// ── Aggregation Service ────────────────────────────────────────────────────

export const bankAggregationService = {
  async getConnectedAccounts(userId: string): Promise<BankAccount[]> {
    void userId;
    // In production, would query a BankConnection table
    return [];
  },

  async getAllTransactions(
    userId: string,
    from?: string,
    to?: string,
  ): Promise<BankTransaction[]> {
    void userId;
    void from;
    void to;
    return [];
  },

  async syncAll(userId: string): Promise<BankSyncResult[]> {
    const connections = await this.getConnectedAccounts(userId);
    const results: BankSyncResult[] = [];
    for (const conn of connections) {
      const provider = getBankProvider(conn.bankId);
      if (provider) {
        const result = await provider.sync(conn.id);
        results.push(result);
      }
    }
    return results;
  },

  getSupportedBanks(): { id: string; name: string }[] {
    return getAllBankProviders().map((p) => ({ id: p.id, name: p.name }));
  },
};
