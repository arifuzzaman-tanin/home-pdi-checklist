import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { checklistCategories, statusOptions } from './data/pdiChecklist'
import { usePDIInspection } from './hooks/usePDIInspection'
import { compressPhoto, photoStore } from './lib/photoStore'
import { downloadBlankChecklist, downloadInspectionReport } from './lib/pdiPdfGenerator'

function Icon({ name, size = 20 }) {
  const paths = {
    check: <path d="m5 12 4 4L19 6" />, x: <><path d="m7 7 10 10" /><path d="m17 7-10 10" /></>, minus: <path d="M5 12h14" />, slash: <path d="M5 19 19 5" />,
    chevron: <path d="m9 18 6-6-6-6" />, search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>, download: <><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /></>, camera: <><path d="M14.5 4 16 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-3Z" /><circle cx="12" cy="13" r="3" /></>,
    trash: <><path d="M4 7h16" /><path d="M9 7V4h6v3" /><path d="m7 7 1 14h8l1-14" /></>, plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>, info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6" /><path d="M12 7h.01" /></>,
    house: <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></>, 'clipboard-check': <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V2h6v2" /><path d="m9 13 2 2 4-4" /></>,
    thermometer: <><path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0Z" /><path d="M12 9v7" /></>, droplets: <><path d="M12 3s5 5.3 5 10a5 5 0 0 1-10 0c0-4.7 5-10 5-10Z" /><path d="M9.5 14.5a2.5 2.5 0 0 0 2 1" /></>,
    zap: <path d="M13 2 4 14h7l-1 8 9-12h-7Z" />, 'door-open': <><path d="M4 21h16" /><path d="M6 21V4l11-2v19" /><path d="M14 12h.01" /></>, 'panel-top': <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M12 9v11" /></>,
    'cooking-pot': <><path d="M5 11h14l-1 9H6Z" /><path d="M3 11h18M8 7c0-2 2-2 2-4M14 7c0-2 2-2 2-4" /></>, bath: <><path d="M3 12h18v3a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5Z" /><path d="M6 12V6a3 3 0 0 1 6 0" /></>,
    sofa: <><path d="M5 12V9a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v3" /><path d="M3 12a2 2 0 0 1 2 2v4h14v-4a2 2 0 0 1 2-2v8H3Z" /></>, stairs: <path d="M4 20h4v-4h4v-4h4V8h4" />,
    warehouse: <><path d="m3 10 9-6 9 6v10H3Z" /><path d="M7 20v-6h10v6M7 10h.01M12 10h.01M17 10h.01" /></>, 'shield-check': <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
    alert: <><path d="M12 3 2 21h20Z" /><path d="M12 9v5M12 18h.01" /></>,
    'circle-check': <><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.25 2.25L15.75 9" /></>,
    'circle-x': <><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6M15 9l-6 6" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    ban: <><circle cx="12" cy="12" r="9" /><path d="m6 6 12 12" /></>,
  }
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.house}</svg>
}

function PDIHeader({ percent, onExport, exporting }) {
  return <header className="app-header"><div className="header-inner"><a className="brand" href="#top" aria-label="Home PDI Checklist, back to top"><span className="brand-mark"><Icon name="house" size={21} /><span><Icon name="check" size={12} /></span></span><span>Home PDI Checklist</span></a><div className="header-actions"><div className="header-progress" aria-label={`${percent}% inspection complete`}><strong>{percent}%</strong><span>complete</span></div><button className="button button-primary header-export" onClick={onExport} disabled={exporting} aria-label="Download report"><Icon name="download" size={17} /><span>{exporting ? 'Preparing…' : 'Download report'}</span></button></div></div></header>
}

function InspectionDetails({ details, onChange }) {
  const [open, setOpen] = useState(false)
  const fields = [['address', 'Property address', 'text', '123 Example Street'], ['city', 'City', 'text', 'Toronto'], ['province', 'Province', 'text', 'Ontario'], ['builder', 'Builder name', 'text', 'Builder or developer'], ['date', 'Inspection date', 'date', ''], ['inspector', 'Inspector / homeowner', 'text', 'Your name']]
  return <section className="panel details-panel" aria-labelledby="details-heading"><button className="section-toggle" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="inspection-details-fields"><span><span className="section-icon"><Icon name="file" /></span><span><strong id="details-heading">Inspection details</strong><small>Optional information included in your report</small></span></span><span className={`chevron ${open ? 'open' : ''}`}><Icon name="chevron" /></span></button>{open && <div id="inspection-details-fields" className="details-grid">{fields.map(([name, label, type, placeholder]) => <label key={name} className={name === 'address' ? 'field-wide' : ''}><span>{label}</span><input type={type} value={details[name] || ''} placeholder={placeholder} onChange={(event) => onChange(name, event.target.value)} /></label>)}<label><span>Property type</span><select value={details.propertyType || ''} onChange={(event) => onChange('propertyType', event.target.value)}><option value="">Select type</option><option>Detached</option><option>Semi-Detached</option><option>Townhouse</option><option>Condo</option><option>Other</option></select></label></div>}</section>
}

function InspectionSummary({ summary }) {
  return <section className="summary-section" aria-labelledby="overview-heading"><div className="summary-card"><div className="summary-copy"><div><span className="eyebrow">Progress</span><h2 id="overview-heading">{summary.completed} of {summary.total} inspected</h2></div><strong>{summary.percent}%</strong></div><div className="progress-track"><span style={{ width: `${summary.percent}%` }} /></div><div className="summary-counts" aria-label="Inspection results"><span className="count-pass"><Icon name="check" size={15} /> {summary.pass} passed</span><span className="count-fail"><Icon name="x" size={15} /> {summary.fail} issues</span><span><Icon name="minus" size={15} /> {summary['not-tested']} remaining</span>{summary.na > 0 && <span><Icon name="slash" size={15} /> {summary.na} N/A</span>}</div></div></section>
}

function ChecklistToolbar({ search, setSearch, filter, setFilter, onExpand, onCollapse, onBlank, exporting }) {
  return <section className="toolbar panel" aria-label="Checklist tools"><div className="toolbar-top"><label className="search-box"><span className="sr-only">Search checklist</span><Icon name="search" size={19} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search checklist" /></label><label className="filter-box"><span className="sr-only">Filter by status</span><select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All statuses</option><option value="not-tested">Not tested</option><option value="pass">Passed</option><option value="fail">Failed</option><option value="na">Not applicable</option></select></label></div><div className="toolbar-actions"><div className="expand-actions"><button className="text-button" onClick={onExpand}>Expand all</button><span aria-hidden="true" /><button className="text-button" onClick={onCollapse}>Collapse all</button></div><button className="text-button blank-checklist" onClick={onBlank} disabled={exporting}><Icon name="file" size={16} /> Blank checklist</button></div></section>
}

function StatusSelector({ item, value, onChange }) {
  return <fieldset className="status-selector"><legend className="sr-only">Status for {item.title}</legend>{statusOptions.map((option) => <label key={option.value} title={option.label} className={`status-option status-${option.value} ${value === option.value ? 'selected' : ''}`}><input type="radio" name={`status-${item.id}`} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} /><span>{option.shortLabel}</span></label>)}</fieldset>
}

function PhotoAttachment({ itemId, photos, onChange }) {
  const [previews, setPreviews] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [activePhoto, setActivePhoto] = useState(null)
  const inputRef = useRef(null)
  const inputId = `photos-${itemId}`

  useEffect(() => {
    if (!activePhoto) return undefined
    const handleKey = (event) => {
      if (event.key === 'Escape') setActivePhoto(null)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [activePhoto])

  useEffect(() => {
    let active = true
    const urls = []
    Promise.all(photos.map(async (photoId) => {
      const blob = await photoStore.get(photoId)
      if (blob) return [photoId, URL.createObjectURL(blob)]
      return null
    })).then((entries) => {
      const availableEntries = entries.filter(Boolean)
      if (!active) {
        availableEntries.forEach(([, url]) => URL.revokeObjectURL(url))
        return
      }
      availableEntries.forEach(([, url]) => urls.push(url))
      setPreviews(Object.fromEntries(availableEntries))
    }).catch(() => {
      if (active) setError('A photo preview is unavailable.')
    })
    return () => {
      active = false
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [photos])

  const upload = async (files) => {
    if (!files.length) return
    setBusy(true)
    setError('')
    const addedPhotos = []
    const failures = []
    for (const file of files) {
      try {
        const blob = await compressPhoto(file)
        const photoId = `${itemId}-${crypto.randomUUID()}`
        await photoStore.set(photoId, blob)
        addedPhotos.push(photoId)
      } catch (uploadError) {
        failures.push(uploadError.message || `Unable to save ${file.name}.`)
      }
    }
    if (addedPhotos.length) onChange([...photos, ...addedPhotos])
    if (failures.length) setError(failures.join(' '))
    setBusy(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  const remove = async (photoId) => {
    setBusy(true)
    setError('')
    try {
      await photoStore.remove(photoId)
      onChange(photos.filter((id) => id !== photoId))
    } catch {
      setError('Unable to remove this photo.')
    } finally {
      setBusy(false)
    }
  }

  return <div className="photo-attachment">
    <input ref={inputRef} className="sr-only" id={inputId} type="file" accept="image/jpeg,image/png,image/webp,image/heic" multiple disabled={busy} onChange={(event) => upload(Array.from(event.target.files || []))} />
    <div className="photo-gallery">
      {photos.map((photoId, index) => <div className="photo-tile" key={photoId}>
        {previews[photoId] ? <button className="photo-preview-button" type="button" onClick={() => setActivePhoto(photoId)} aria-label={`View inspection photo ${index + 1}`}><img src={previews[photoId]} alt="" /></button> : <span className="photo-placeholder"><Icon name="camera" size={20} /></span>}
        <button className="photo-delete-button" type="button" onClick={() => remove(photoId)} disabled={busy} aria-label={`Remove photo ${index + 1}`} title="Remove photo"><Icon name="trash" size={13} /></button>
      </div>)}
      <label className={`photo-add-tile ${busy ? 'is-busy' : ''}`} htmlFor={inputId} aria-disabled={busy}>
        <span><Icon name="plus" size={20} /></span>
        <strong>{busy ? 'Adding…' : 'Add photos'}</strong>
      </label>
    </div>
    {activePhoto && previews[activePhoto] && <div className="photo-viewer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setActivePhoto(null) }}>
      <div className="photo-viewer-dialog" role="dialog" aria-modal="true" aria-label="Inspection photo preview">
        <button className="photo-viewer-close" type="button" onClick={() => setActivePhoto(null)} aria-label="Close photo preview" autoFocus><Icon name="x" size={20} /></button>
        <img src={previews[activePhoto]} alt={`Enlarged inspection photo ${photos.indexOf(activePhoto) + 1}`} />
        <p>Photo {photos.indexOf(activePhoto) + 1} of {photos.length}</p>
      </div>
    </div>}
    <p className="photo-privacy"><Icon name="shield-check" size={13} /> Compressed and stored only on this device</p>
    {error && <p className="inline-error" role="alert">{error}</p>}
  </div>
}

function ChecklistItem({ item, response, updateResponse }) {
  const [showDetails, setShowDetails] = useState(Boolean(response.note || response.photos.length || response.status === 'fail'))
  const detailsVisible = showDetails || response.status === 'fail' || Boolean(response.note || response.photos.length)
  return <article className={`checklist-item ${response.status === 'fail' ? 'is-failed' : ''}`}><div className="item-main"><div className="item-copy"><h4>{item.title}{response.status === 'fail' && <span className="deficiency-badge"><Icon name="alert" size={13} /> Deficiency</span>}</h4><p>{item.description}</p></div><StatusSelector item={item} value={response.status} onChange={(status) => updateResponse(item.id, { status })} /></div>{!detailsVisible ? <button className="add-note-button" type="button" onClick={() => setShowDetails(true)}><Icon name="plus" size={15} /> Add note or photo</button> : <div className="item-details"><label><span>{response.status === 'fail' ? 'Deficiency note' : 'Inspection note'} <small>optional</small></span><textarea value={response.note} onChange={(event) => updateResponse(item.id, { note: event.target.value })} placeholder={response.status === 'fail' ? 'Describe the issue or deficiency…' : 'Add an observation, measurement, or reason this item could not be tested…'} rows="3" /></label><PhotoAttachment itemId={item.id} photos={response.photos} onChange={(photos) => updateResponse(item.id, { photos })} /></div>}</article>
}

function ChecklistCategory({ category, items, expanded, onToggle, responseFor, updateResponse }) {
  const complete = category.items.filter((item) => responseFor(item.id).status !== 'not-tested').length; const percent = category.items.length ? Math.round((complete / category.items.length) * 100) : 0; const panelId = `category-${category.id}`
  return <section className={`category panel ${expanded ? 'expanded' : ''}`}><button className="category-header" type="button" onClick={onToggle} aria-expanded={expanded} aria-controls={panelId}><span className="category-icon"><Icon name={category.icon} size={22} /></span><span className="category-title"><strong>{category.title}</strong><small>{complete} of {category.items.length} completed <span aria-hidden="true">•</span> {percent}%</small><span className="mini-progress"><span style={{ width: `${percent}%` }} /></span></span><span className={`chevron ${expanded ? 'open' : ''}`}><Icon name="chevron" /></span></button>{expanded && <div id={panelId} className="category-body"><div className="category-intro"><div><p>{category.description}</p>{category.banner && <strong>{category.banner}</strong>}{category.caution && <p className="caution"><Icon name="info" size={16} /> {category.caution}</p>}</div></div><div className="items-list">{items.map((item) => <ChecklistItem key={item.id} item={item} response={responseFor(item.id)} updateResponse={updateResponse} />)}</div></div>}</section>
}

function ConfirmDialog({ open, onCancel, onConfirm }) {
  useEffect(() => { if (!open) return undefined; const handleKey = (event) => { if (event.key === 'Escape') onCancel() }; document.addEventListener('keydown', handleKey); return () => document.removeEventListener('keydown', handleKey) }, [open, onCancel])
  if (!open) return null
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel() }}><div className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="reset-title" aria-describedby="reset-description"><span className="dialog-icon"><Icon name="alert" /></span><h2 id="reset-title">Start a new inspection?</h2><p id="reset-description">This clears all property details, statuses, notes, and photos stored on this device. This action cannot be undone.</p><div><button className="button button-secondary" onClick={onCancel} autoFocus>Cancel</button><button className="button button-danger" onClick={onConfirm}>Clear and start new</button></div></div></div>
}

function App() {
  const { state, summary, responseFor, updateDetails, updateResponse, toggleExpanded, setAllExpanded, resetInspection, saveStatus } = usePDIInspection()
  const [search, setSearch] = useState(''); const [filter, setFilter] = useState('all'); const [exporting, setExporting] = useState(false); const [exportError, setExportError] = useState(''); const [confirmReset, setConfirmReset] = useState(false); const normalizedSearch = search.trim().toLowerCase()
  const visibleCategories = useMemo(() => checklistCategories.map((category) => { const categoryMatches = `${category.title} ${category.description}`.toLowerCase().includes(normalizedSearch); const items = category.items.filter((item) => { const matchesSearch = !normalizedSearch || categoryMatches || `${item.title} ${item.description}`.toLowerCase().includes(normalizedSearch); const matchesFilter = filter === 'all' || responseFor(item.id).status === filter; return matchesSearch && matchesFilter }); return { category, items } }).filter(({ items }) => items.length), [normalizedSearch, filter, responseFor])
  const runExport = async (type) => { if (exporting) return; setExporting(true); setExportError(''); try { await new Promise((resolve) => setTimeout(resolve, 30)); if (type === 'blank') await downloadBlankChecklist(); else await downloadInspectionReport({ details: state.details, responses: state.responses, summary }) } catch (error) { console.error(error); setExportError('We could not create the PDF. Please try again or use a different browser.') } finally { setExporting(false) } }
  const filtering = Boolean(normalizedSearch || filter !== 'all')
  return <><PDIHeader percent={summary.percent} onExport={() => runExport('report')} exporting={exporting} /><main id="top"><section className="hero-section" aria-labelledby="page-title"><div className="context-label"><Icon name="house" size={15} /> Designed for Ontario home inspections</div><h1 id="page-title">Home PDI Checklist</h1><p className="hero-subtitle">Inspect your home with confidence. Check every detail, record deficiencies, and download your inspection report.</p><div className="start-note"><span><Icon name="thermometer" size={20} /></span><p><strong>Start with systems that need time.</strong> Turn on heating, cooling (when conditions permit), hot water, and ventilation, then inspect the rest of the home while they run.</p></div></section><InspectionDetails details={state.details} onChange={updateDetails} /><div className={`save-status save-${saveStatus}`} role="status"><span />{saveStatus === 'error' ? 'Unable to save locally — changes may not persist' : saveStatus === 'saving' ? 'Saving on this device…' : 'Saved on this device'}</div><InspectionSummary summary={summary} /><section className="checklist-section" aria-labelledby="checklist-heading"><div className="section-heading checklist-heading"><div><span className="eyebrow">Room-by-room walkthrough</span><h2 id="checklist-heading">Inspection checklist</h2></div><p>Choose one status for each item. Untested is the safe default.</p></div><ChecklistToolbar search={search} setSearch={setSearch} filter={filter} setFilter={setFilter} onExpand={() => setAllExpanded(true)} onCollapse={() => setAllExpanded(false)} onReport={() => runExport('report')} onBlank={() => runExport('blank')} exporting={exporting} />{exportError && <div className="export-error" role="alert"><Icon name="alert" size={18} /> {exportError}</div>}<div className="categories-list">{visibleCategories.map(({ category, items }) => <ChecklistCategory key={category.id} category={category} items={items} expanded={filtering || state.expanded[category.id]} onToggle={() => { if (!filtering) toggleExpanded(category.id) }} responseFor={responseFor} updateResponse={updateResponse} />)}</div>{!visibleCategories.length && <div className="empty-state"><span><Icon name="search" size={26} /></span><h3>No checklist items found</h3><p>Try another search or choose a different status.</p><button className="button button-secondary" onClick={() => { setSearch(''); setFilter('all') }}>Clear filters</button></div>}</section><section className="legal-note"><Icon name="info" size={18} /><p>This checklist is a personal inspection aid, not an official Tarion or government product. Keep the builder’s official PDI form, document inaccessible or weather-dependent items, and consider a qualified professional inspection. A completed checklist cannot guarantee a defect-free home.</p></section><footer><div><span className="brand footer-brand"><span className="brand-mark"><Icon name="house" size={18} /></span> Home PDI Checklist</span><p>Your inspection data and photos remain on this device.</p></div><button className="reset-button" onClick={() => setConfirmReset(true)}><Icon name="trash" size={15} /> Start new inspection</button></footer></main><ConfirmDialog open={confirmReset} onCancel={() => setConfirmReset(false)} onConfirm={async () => { await resetInspection(); setConfirmReset(false); setSearch(''); setFilter('all'); window.scrollTo({ top: 0, behavior: 'smooth' }) }} /></>
}

export default App
