import jsPDF from 'jspdf'
import type { GeneratedLetter } from './credit-repair-types'

// ============================================
// PDF Generator
// ============================================
// Wraps jspdf to produce a clean, single-column dispute letter PDF.
// Letterhead is intentionally minimal — clients should look like an
// individual consumer, not a credit-repair company, to avoid §1679
// CROA issues at the bureau level.

interface BuildOptions {
  letter: GeneratedLetter
  fileName?: string
}

export function downloadLetterPdf({ letter, fileName }: BuildOptions): void {
  const doc = buildPdf(letter)
  const safeAgency = letter.agencyName.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()
  const dateStr = new Date(letter.generatedAt).toISOString().slice(0, 10)
  doc.save(fileName || `dispute-letter-${safeAgency}-${dateStr}.pdf`)
}

export function buildPdf(letter: GeneratedLetter): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 56 // 0.78 inch
  const maxWidth = pageWidth - margin * 2
  const lineHeight = 14

  doc.setFont('times', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(20, 20, 25)

  // Body
  const lines = doc.splitTextToSize(letter.content, maxWidth)
  let y = margin
  for (const line of lines) {
    if (y > pageHeight - margin) {
      doc.addPage()
      y = margin
    }
    doc.text(line as string, margin, y)
    y += lineHeight
  }

  // Footer
  const totalPages = (doc as any).internal.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    doc.setFontSize(8)
    doc.setTextColor(140, 140, 145)
    doc.text(
      `Sent by certified mail   •   Page ${p} of ${totalPages}`,
      margin,
      pageHeight - 28
    )
  }
  return doc
}

export function getPdfBlob(letter: GeneratedLetter): Blob {
  return buildPdf(letter).output('blob')
}
