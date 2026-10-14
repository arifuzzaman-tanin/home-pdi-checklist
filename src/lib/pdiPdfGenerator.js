import { checklistCategories } from '../data/pdiChecklist'
import { blobToDataUrl, photoStore } from './photoStore'

const LABELS = { pass: 'PASS', fail: 'FAIL', 'not-tested': 'NOT TESTED', na: 'N/A' }
const COLORS = { pass: [22, 163, 74], fail: [220, 38, 38], 'not-tested': [100, 116, 139], na: [71, 85, 105] }

const safeFilename = (value) => value
  .replace(/[^a-z0-9]+/gi, '-')
  .replace(/(^-|-$)/g, '')
  .slice(0, 42)

const createDocument = async (title) => {
  // Use the installed browser bundle directly. Some embedded Vite preview
  // environments do not resolve dynamically imported bare package names.
  const { jsPDF } = await import('../../node_modules/jspdf/dist/jspdf.es.min.js')
  const doc = new jsPDF({ unit: 'pt', format: 'letter', compress: true })
  doc.setProperties({ title, subject: 'Home pre-delivery inspection checklist', creator: 'Home PDI Checklist' })
  return doc
}

const pageWriter = (doc) => {
  const left = 48
  const right = 564
  const bottom = 735
  let y = 48

  const ensure = (height = 20) => {
    if (y + height > bottom) {
      doc.addPage()
      y = 48
    }
  }
  const text = (value, options = {}) => {
    const { size = 9, style = 'normal', color = [15, 23, 42], indent = 0, gap = 4, maxWidth = right - left - indent } = options
    doc.setFont('helvetica', style)
    doc.setFontSize(size)
    doc.setTextColor(...color)
    const lines = doc.splitTextToSize(String(value || '—'), maxWidth)
    const height = lines.length * size * 1.25
    ensure(height + gap)
    doc.text(lines, left + indent, y)
    y += height + gap
    return lines
  }
  const line = () => {
    ensure(12)
    doc.setDrawColor(226, 232, 240)
    doc.line(left, y, right, y)
    y += 10
  }
  return { ensure, text, line, getY: () => y, setY: (next) => { y = next }, left, right, bottom }
}

const addDocumentHeader = (doc, writer, title, details, subtitle) => {
  doc.setFillColor(37, 99, 235)
  doc.rect(0, 0, 612, 12, 'F')
  writer.text(title, { size: 20, style: 'bold', gap: 7 })
  writer.text(subtitle, { size: 9, color: [100, 116, 139], gap: 14 })
  const rows = [
    ['Property', [details.address, details.city, details.province].filter(Boolean).join(', ')],
    ['Builder', details.builder], ['Inspection date', details.date], ['Inspector / homeowner', details.inspector],
    ['Property type', details.propertyType],
  ].filter(([, value]) => value)
  rows.forEach(([label, value]) => writer.text(`${label}: ${value}`, { size: 9, gap: 3 }))
  writer.line()
}

const addFooters = (doc, generatedAt) => {
  const pages = doc.getNumberOfPages()
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page)
    doc.setDrawColor(226, 232, 240)
    doc.line(48, 754, 564, 754)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(100, 116, 139)
    doc.text('Personal inspection record — not the builder’s official PDI form or a substitute for a professional inspection.', 48, 770)
    doc.text(`Generated ${generatedAt}  •  Page ${page} of ${pages}`, 564, 782, { align: 'right' })
  }
}

const addCategoryHeading = (writer, category, detail) => {
  writer.ensure(40)
  writer.text(category.title, { size: 13, style: 'bold', color: [15, 23, 42], gap: 3 })
  if (detail) writer.text(detail, { size: 8.5, color: [100, 116, 139], gap: 8 })
}

const addResultItem = async (doc, writer, checklistItem, response, includePhotos) => {
  writer.ensure(response.note ? 62 : 42)
  const status = response.status || 'not-tested'
  doc.setFillColor(...COLORS[status])
  doc.roundedRect(writer.left, writer.getY() - 8, 74, 16, 4, 4, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(255, 255, 255)
  doc.text(LABELS[status], writer.left + 37, writer.getY() + 2, { align: 'center' })
  writer.text(checklistItem.title, { size: 9.5, style: 'bold', indent: 84, maxWidth: 432, gap: 4 })
  writer.text(checklistItem.description, { size: 8, color: [100, 116, 139], indent: 84, maxWidth: 432, gap: response.note ? 3 : 8 })
  if (response.note) writer.text(`Note: ${response.note}`, { size: 8.5, color: status === 'fail' ? [185, 28, 28] : [51, 65, 85], indent: 84, maxWidth: 432, gap: 8 })

  if (includePhotos && response.photos?.length) {
    for (const photoId of response.photos) {
      try {
        const blob = await photoStore.get(photoId)
        if (!blob) continue
        const dataUrl = await blobToDataUrl(blob)
        writer.ensure(105)
        doc.addImage(dataUrl, 'JPEG', writer.left + 84, writer.getY(), 120, 90, undefined, 'FAST')
        writer.setY(writer.getY() + 98)
      } catch { /* A report remains useful if an optional photo cannot be read. */ }
    }
  }
  writer.line()
}

export async function downloadInspectionReport({ details, responses, summary }) {
  const doc = await createDocument('Home PDI Inspection Report')
  const writer = pageWriter(doc)
  addDocumentHeader(doc, writer, 'Home PDI Inspection Report', details, 'A structured record of your home walkthrough')
  writer.text('Inspection summary', { size: 13, style: 'bold', gap: 7 })
  writer.text(`Completion ${summary.percent}%   •   Total ${summary.total}   •   Passed ${summary.pass}   •   Failed ${summary.fail}   •   Not tested ${summary['not-tested']}   •   N/A ${summary.na}`, { size: 9, gap: 12 })
  writer.text('Inspection results', { size: 16, style: 'bold', gap: 12 })

  for (const category of checklistCategories) {
    const completed = category.items.filter((entry) => (responses[entry.id]?.status || 'not-tested') !== 'not-tested').length
    addCategoryHeading(writer, category, `${completed} of ${category.items.length} completed`)
    for (const checklistItem of category.items) {
      await addResultItem(doc, writer, checklistItem, responses[checklistItem.id] || { status: 'not-tested' }, true)
    }
  }

  doc.addPage()
  writer.setY(48)
  writer.text('Deficiencies', { size: 18, style: 'bold', gap: 8 })
  writer.text('Items marked Fail, grouped by category.', { size: 9, color: [100, 116, 139], gap: 14 })
  let failed = 0
  for (const category of checklistCategories) {
    const items = category.items.filter((entry) => responses[entry.id]?.status === 'fail')
    if (!items.length) continue
    failed += items.length
    addCategoryHeading(writer, category)
    for (const checklistItem of items) await addResultItem(doc, writer, checklistItem, responses[checklistItem.id], true)
  }
  if (!failed) writer.text('No failed items are currently recorded.', { size: 10, color: [71, 85, 105] })

  doc.addPage()
  writer.setY(48)
  writer.text('Not tested', { size: 18, style: 'bold', gap: 8 })
  writer.text('Outstanding, inaccessible, and weather-dependent items.', { size: 9, color: [100, 116, 139], gap: 14 })
  for (const category of checklistCategories) {
    const items = category.items.filter((entry) => (responses[entry.id]?.status || 'not-tested') === 'not-tested')
    if (!items.length) continue
    addCategoryHeading(writer, category)
    for (const checklistItem of items) {
      const response = responses[checklistItem.id] || { status: 'not-tested' }
      await addResultItem(doc, writer, checklistItem, response, false)
    }
  }

  const generatedAt = new Intl.DateTimeFormat('en-CA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date())
  addFooters(doc, generatedAt)
  const addressPart = details.address ? `-${safeFilename(details.address)}` : ''
  doc.save(`PDI-Inspection${addressPart}-${details.date || new Date().toISOString().slice(0, 10)}.pdf`)
}

export async function downloadBlankChecklist() {
  const doc = await createDocument('Blank Home PDI Checklist')
  const writer = pageWriter(doc)
  addDocumentHeader(doc, writer, 'Blank Home PDI Checklist', {}, 'Reusable field checklist — mark one status for every item')
  writer.text('Property: _________________________________________________', { size: 9, gap: 7 })
  writer.text('Builder: ____________________   Date: ____________________   Inspector: ____________________', { size: 9, gap: 14 })

  for (const category of checklistCategories) {
    addCategoryHeading(writer, category, category.description)
    for (const checklistItem of category.items) {
      writer.ensure(58)
      writer.text(checklistItem.title, { size: 9.5, style: 'bold', gap: 3 })
      writer.text(checklistItem.description, { size: 8, color: [100, 116, 139], gap: 5 })
      writer.text('[ ] Pass     [ ] Fail     [ ] Not Tested     [ ] N/A', { size: 8.5, gap: 5 })
      writer.text('Notes: __________________________________________________________________________', { size: 8, color: [71, 85, 105], gap: 8 })
      writer.line()
    }
  }

  const generatedAt = new Intl.DateTimeFormat('en-CA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date())
  addFooters(doc, generatedAt)
  doc.save('Blank-Home-PDI-Checklist.pdf')
}
