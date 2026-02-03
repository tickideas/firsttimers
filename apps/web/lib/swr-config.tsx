import { SWRConfig } from 'swr'
import type { ReactNode } from 'react'
import { api } from './api'

export const fetcher = async (url: string) => {
  const response = await api.get(url)
  return response
}

export const swrConfig = {
  fetcher,
  refreshInterval: 0,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  dedupingInterval: 2000,
}

export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig value={swrConfig}>
      {children}
    </SWRConfig>
  )
}
