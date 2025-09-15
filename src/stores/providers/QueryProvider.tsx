// /src/providers/QueryProvider.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createRQMMKVPersister } from '../../utils/mmkvStorage';


export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            staleTime: 1000 * 60 * 5, // 5 mins
            gcTime: 1000 * 60 * 5,  // 5 mins
            refetchOnWindowFocus: false,
        },
        mutations: {
            retry: 0,
        },
    },
});

persistQueryClient({
  queryClient,
  persister: createRQMMKVPersister(),
  maxAge: 24 * 60 * 60 * 1000, // keep data max 1 day
  dehydrateOptions: {
    shouldDehydrateQuery: (query) =>
      query.queryKey[0] === "dashboardData" && query.state.status === "success",
  },
});

export const QueryProvider = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
        {children}
    </QueryClientProvider>
);
