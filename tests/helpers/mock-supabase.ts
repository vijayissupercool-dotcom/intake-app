/**
 * Mock Supabase client for unit/integration tests.
 * Returns controlled responses without hitting a real database.
 */

type QueryFilter = { type: string; column?: string; value?: unknown };

interface MockQueryState {
  data: unknown;
  error: unknown;
  filters: QueryFilter[];
  singleResult: boolean;
}

export function createMockSupabase(overrides?: {
  userData?: Record<string, unknown>;
  requestsData?: unknown[];
  uploadsData?: unknown[];
  connectionData?: Record<string, unknown> | null;
}) {
  const state: MockQueryState = {
    data: null,
    error: null,
    filters: [],
    singleResult: false,
  };

  function chain() {
    const builder: Record<string, unknown> = {
      select: (fields?: string) => {
        state.filters.push({ type: "select", value: fields });
        return builder;
      },
      eq: (column: string, value: unknown) => {
        state.filters.push({ type: "eq", column, value });
        return builder;
      },
      neq: (column: string, value: unknown) => {
        state.filters.push({ type: "neq", column, value });
        return builder;
      },
      single: () => {
        state.singleResult = true;
        return builder;
      },
      order: () => builder,
      limit: () => builder,
      in: () => builder,
    };

    // Terminal methods that return promises
    const resolve = () => {
      if (state.singleResult) {
        const data = Array.isArray(state.data) ? state.data[0] : state.data;
        return { data, error: state.error };
      }
      return { data: state.data, error: state.error };
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (builder as any).then = (resolveFn: (val: unknown) => unknown) => {
      return Promise.resolve(resolve()).then(resolveFn);
    };

    return builder;
  }

  const mockAuth = {
    getUser: async () => ({
      data: {
        user: overrides?.userData
          ? { id: overrides.userData.id, email: overrides.userData.email, ...overrides.userData }
          : null,
      },
      error: null,
    }),
    signOut: async () => ({ error: null }),
  };

  return {
    auth: mockAuth,
    from: (table: string) => {
      // Route to appropriate data based on table
      if (table === "requests" && overrides?.requestsData) {
        state.data = overrides.requestsData;
      } else if (table === "uploads" && overrides?.uploadsData) {
        state.data = overrides.uploadsData;
      } else if (table === "google_connections" && overrides?.connectionData) {
        state.data = overrides.connectionData;
      }
      return chain();
    },
    rpc: async (fn: string, params?: Record<string, unknown>) => {
      if (fn === "check_and_increment_upload_count") {
        const maxFiles = params?.p_max_files as number;
        // Simulate: always succeed unless max is 0
        return { data: maxFiles > 0, error: null };
      }
      if (fn === "increment_upload_count") {
        return { data: null, error: null };
      }
      if (fn === "claim_transfer_jobs") {
        return { data: [], error: null };
      }
      return { data: null, error: null };
    },
    removeChannel: () => {},
    channel: () => ({
      on: () => ({ subscribe: () => ({}) }),
    }),
    _state: state,
  };
}
