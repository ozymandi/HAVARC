import type { ReactNode } from 'react'
import { WORK_PERFORMED_ITEMS } from './checklists'
import { PdfBody, PdfChecklist, PdfFooter, PdfHeroBig, PdfHeroSmall, PdfSection, PdfThankYou, PdfUnitCard } from './primitives'
import type { InvoicePdfData } from './types'

const money = (n: number) => `$${n.toFixed(2)}`

/** Figma: PDF · Invoice · Page 1–2 (213:3679, 229:8527). Customer-paid items print with
 *  their price but a $0.00 amount and are excluded from the totals (Line Item component
 *  doc). Customer notes are deliberately NOT on the invoice (client decision). */
export function invoicePages(inv: InvoicePdfData): ReactNode[] {
  const subtotal = inv.items.reduce((sum, i) => sum + (i.customerPaid ? 0 : i.qty * i.unitPrice), 0)
  const tax = subtotal * (inv.taxRate / 100)
  const total = Math.max(0, subtotal + tax - inv.discount)
  const numberLabel = inv.number === 'Draft' ? 'DRAFT' : `#${inv.number}`
  const pill = `Invoice ${inv.number === 'Draft' ? '(draft)' : `#${inv.number}`} · ${inv.customer} · ${inv.date}`

  const page1 = (
    <>
      <PdfHeroBig
        title={`INVOICE ${numberLabel}`}
        rows={[
          ['CUSTOMER', inv.customer],
          ['ADDRESS', inv.addressLines],
          ['DATE', inv.date],
          ['PHONE', inv.phone ?? '—'],
          ['WORK ORDER', inv.workOrder],
        ]}
      />
      <PdfBody className="py-3xl">
        <div className="flex w-full flex-col overflow-hidden rounded-2xs border border-line">
          <div className="flex items-start gap-sm bg-brand px-sm py-[5px] text-pdf-table text-inverse">
            <p className="min-w-0 flex-1">DESCRIPTION</p>
            <p className="w-[56px] shrink-0 text-center">QTY</p>
            <p className="w-[80px] shrink-0 text-right">UNIT PRICE</p>
            <p className="w-[84px] shrink-0 text-right">AMOUNT</p>
          </div>
          {inv.items.map((item) => (
            <div key={item.id} className="flex items-start gap-sm border-t border-line px-sm py-[5px] text-pdf-body text-ink">
              <p className="min-w-0 flex-1">
                {item.description}
                {item.customerPaid ? ' (Customer Paid)' : ''}
              </p>
              <p className="w-[56px] shrink-0 text-center">{item.qty}</p>
              <p className="w-[80px] shrink-0 text-right">{money(item.unitPrice)}</p>
              <p className="w-[84px] shrink-0 text-right">{money(item.customerPaid ? 0 : item.qty * item.unitPrice)}</p>
            </div>
          ))}
        </div>

        <div className="flex w-full flex-col overflow-hidden rounded-2xs border border-line">
          <div className="flex items-start gap-sm bg-surface-alt px-[10px] py-[5px] text-ink">
            <p className="min-w-0 flex-1 text-pdf-table">SUBTOTAL</p>
            <p className="text-pdf-body text-right">{money(subtotal)}</p>
          </div>
          <div className="flex items-start gap-sm bg-surface-alt px-[10px] py-[5px] text-ink">
            <p className="min-w-0 flex-1 text-pdf-table">TAX ({inv.taxRate.toFixed(2)}%)</p>
            <p className="text-pdf-body text-right">{money(tax)}</p>
          </div>
          {inv.discount > 0 && (
            <div className="flex items-start gap-sm bg-surface-alt px-[10px] py-[5px] text-ink">
              <p className="min-w-0 flex-1 text-pdf-table">DISCOUNT</p>
              <p className="text-pdf-body text-right">−{money(inv.discount)}</p>
            </div>
          )}
          <div className="flex items-center gap-sm bg-brand px-[10px] py-[7px] text-inverse">
            <p className="min-w-0 flex-1 text-pdf-section">TOTAL</p>
            <p className="text-pdf-emphasis text-right">{money(total)}</p>
          </div>
        </div>

        <PdfSection title="DESCRIPTION OF WORK">
          <p className="text-pdf-body text-ink">{inv.description || '—'}</p>
        </PdfSection>
      </PdfBody>
      <PdfFooter page={1} total={2} />
    </>
  )

  const signatureField = (label: string, className = '') => (
    <div className={`flex flex-col gap-[3px] pt-[14px] ${className}`}>
      <div className="h-px w-full bg-line-strong" />
      <p className="text-pdf-small text-ink-faint">{label}</p>
    </div>
  )

  const page2 = (
    <>
      <PdfHeroSmall pill={pill} />
      <PdfBody className="py-lg">
        <div className="flex w-full items-start gap-md">
          <PdfSection title="UNIT DESCRIPTION" className="flex-1">
            {inv.equipment.map((u, i) => (
              <PdfUnitCard
                key={i}
                title={['UNIT ' + (i + 1), u.unitId, u.location].filter(Boolean).join(' · ')}
                rows={[
                  ['Type', u.type],
                  ['Brand', u.manufacturer],
                  ['Model', u.model],
                  ['Serial No.', u.serial],
                ]}
                labelWidth={70}
              />
            ))}
          </PdfSection>
          <PdfSection title="WORK PERFORMED" className="flex-1">
            <PdfChecklist items={WORK_PERFORMED_ITEMS} checked={inv.workPerformed} />
          </PdfSection>
        </div>

        <div className="flex w-full flex-col gap-[10px] rounded-2xs border border-line px-[10px] pb-[10px] pt-sm">
          <p className="text-pdf-body text-ink">I hereby acknowledge the work performed as described above and agree to the charges.</p>
          <div className="flex w-full items-start gap-lg">
            {signatureField('DATE COMPLETED', 'w-[150px] shrink-0')}
            {signatureField('PRINT NAME', 'min-w-0 flex-1')}
          </div>
          <div className="flex w-full items-start gap-lg">
            {signatureField('JOB TITLE', 'w-[150px] shrink-0')}
            {signatureField('SIGNATURE', 'min-w-0 flex-1')}
          </div>
        </div>

        <PdfThankYou />
      </PdfBody>
      <PdfFooter page={2} total={2} />
    </>
  )

  return [page1, page2]
}
