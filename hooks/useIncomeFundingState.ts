import { useState, useCallback } from 'react'
import { mockDeal } from '@/lib/income-funding-mock'
import type { DealOffer, DealStatus, DocumentRecord, IncomeFundingDeal } from '@/lib/income-funding-types'

// ============================================
// State Machine Hook for Income-Based Funding
// ============================================
// In production, replace useState(mockDeal) with a Firestore subscription:
//   const [deal] = useDocument(doc(db, `users/${uid}/income-funding-deals/${dealId}`))
// and persist setDeal* calls back to Firestore.

export function useIncomeFundingState() {
  const [deal, setDeal] = useState<IncomeFundingDeal>(mockDeal)

  const setStatus = useCallback((status: DealStatus) => {
    setDeal((d) => ({ ...d, status }))
  }, [])

  const setDocuments = useCallback((documents: DocumentRecord[]) => {
    setDeal((d) => ({ ...d, documents }))
  }, [])

  const uploadDocument = useCallback(
    (key: DocumentRecord['key'], fileName: string, fileSize: string) => {
      setDeal((d) => ({
        ...d,
        documents: d.documents.map((doc) =>
          doc.key === key ? { ...doc, status: 'uploaded' as const, fileName, fileSize } : doc
        ),
      }))
    },
    []
  )

  const submitForUnderwriting = useCallback(() => {
    setDeal((d) => ({ ...d, status: 'under-review', submittedAt: new Date().toISOString() }))
  }, [])

  const selectOffer = useCallback((offer: DealOffer) => {
    setDeal((d) => ({ ...d, selectedOfferId: offer.id, status: 'accepting' }))
  }, [])

  const acceptOffer = useCallback(() => {
    setDeal((d) => ({ ...d, status: 'complete', acceptedAt: new Date().toISOString() }))
  }, [])

  const reset = useCallback(() => {
    setDeal({ ...mockDeal, status: 'prequalified', selectedOfferId: undefined })
  }, [])

  return {
    deal,
    setStatus,
    setDocuments,
    uploadDocument,
    submitForUnderwriting,
    selectOffer,
    acceptOffer,
    reset,
  }
}
