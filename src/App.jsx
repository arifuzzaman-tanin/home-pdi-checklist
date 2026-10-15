import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Bathtub, Camera, CaretDown, Check, ClipboardText, CookingPot,
  Couch, DoorOpen, DownloadSimple, Drop, FileText, GridFour, House, Info,
  Lightning, Minus, Plus, Prohibit, ShieldCheck,
  Stairs, ThermometerSimple, Trash, Warehouse, WarningCircle, X,
} from '@phosphor-icons/react'
import './App.css'
import { checklistCategories, statusOptions } from './data/pdiChecklist'
import { usePDIInspection } from './hooks/usePDIInspection'
import { compressPhoto, photoStore } from './lib/photoStore'
import { downloadBlankChecklist, downloadInspectionReport } from './lib/pdiPdfGenerator'

const categoryIcons = {
  thermometer: ThermometerSimple, droplets: Drop, zap: Lightning, 'door-open': DoorOpen,
  'panel-top': GridFour, 'cooking-pot': CookingPot, bath: Bathtub, sofa: Couch,
  stairs: Stairs, warehouse: Warehouse, 'shield-check': ShieldCheck,
  'clipboard-check': ClipboardText, house: House,
}

const friendlyStatuses = {
  pass: { label: 'Looks good', helper: 'Marked as passed', Icon: Check },
  fail: { label: 'Has an issue', helper: 'Flagged for review', Icon: WarningCircle },
  'not-tested': { label: 'Not tested', helper: 'Not inspected', Icon: Minus },
  na: { label: "Doesn't apply", helper: 'Not relevant', Icon: Prohibit },
}

function BrandMark() {
  return <span className="brand-mark"><House weight="fill" size={24} /><span><Check weight="bold" size={12} /></span></span>
}

function PDIHeader({ onExport, exporting }) {
  return <header className="app-header"><div className="header-inner">
    <a className="brand" href="#top" aria-label="Home PDI, back to top"><BrandMark /><span>Home PDI</span></a>
    <button className="button button-primary header-export" onClick={onExport} disabled={exporting}><DownloadSimple weight="bold" size={21} /><span>{exporting ? 'Preparing…' : 'Download report'}</span></button>
  </div></header>
}

function ProgressSummary({ summary }) {
  return <section className="progress-card" aria-labelledby="progress-heading">
    <div className="progress-title"><h1 id="progress-heading">You’ve checked {summary.completed} of {summary.total} items</h1><strong>{summary.percent}%</strong></div>
    <div className="progress-track" aria-hidden="true"><span style={{ width: `${summary.percent}%` }} /></div>
    <div className="status-legend" aria-label="What each status means">
      {statusOptions.map(({ value }) => {
        const { label, helper, Icon } = friendlyStatuses[value]
        return <div className={`legend-item legend-${value}`} key={value}><span className="legend-icon"><Icon weight="bold" size={18} /></span><span><strong>{label}</strong><small>{helper}</small></span></div>
      })}
    </div>
  </section>
}

function AreaPicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const pickerRef = useRef(null)
  const optionRefs = useRef([])
  const areaOptions = [
    { id: 'all', title: 'All areas', icon: 'house', items: checklistCategories.flatMap((category) => category.items) },
    ...checklistCategories,
  ]
  const selectedCategory = areaOptions.find((category) => category.id === value)

  useEffect(() => {
    if (!open) return undefined
    const handlePointerDown = (event) => {
      if (!pickerRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  useEffect(() => {
    if (open) optionRefs.current[activeIndex]?.focus()
  }, [open, activeIndex])

  const showMenu = (index = Math.max(0, areaOptions.findIndex((category) => category.id === value))) => {
    setActiveIndex(index)
    setOpen(true)
  }

  const selectCategory = (category) => {
    onChange(category.id)
    setOpen(false)
  }

  const handleButtonKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      showMenu(event.key === 'ArrowUp' ? areaOptions.length - 1 : Math.max(0, areaOptions.findIndex((category) => category.id === value)))
    }
  }

  const handleMenuKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
      pickerRef.current?.querySelector('.area-picker-trigger')?.focus()
      return
    }
    const nextIndex = event.key === 'Home' ? 0
      : event.key === 'End' ? areaOptions.length - 1
        : event.key === 'ArrowDown' ? (activeIndex + 1) % areaOptions.length
          : event.key === 'ArrowUp' ? (activeIndex - 1 + areaOptions.length) % areaOptions.length
            : null
    if (nextIndex !== null) {
      event.preventDefault()
      setActiveIndex(nextIndex)
    }
  }

  return <div className={`area-picker ${open ? 'is-open' : ''}`} ref={pickerRef}>
    <button className="area-picker-trigger" type="button" aria-haspopup="listbox" aria-expanded={open} aria-controls="area-picker-menu" onClick={() => open ? setOpen(false) : showMenu()} onKeyDown={handleButtonKeyDown}>
      <span className="area-picker-icon"><GridFour weight="fill" size={23} /></span>
      <span className="area-picker-copy"><span className={selectedCategory ? 'area-picker-value' : 'area-picker-placeholder'}>{selectedCategory?.title || 'Select an inspection area'}</span>{selectedCategory && <small>{selectedCategory.items.length} inspection items</small>}</span>
      <span className="area-picker-chevron"><CaretDown weight="bold" size={20} /></span>
    </button>
    {open && <div className="area-picker-menu" id="area-picker-menu" role="listbox" aria-label="Inspection areas" onKeyDown={handleMenuKeyDown}>
      {areaOptions.map((category, index) => {
        const Icon = categoryIcons[category.icon] || House
        const selected = category.id === value
        return <button ref={(node) => { optionRefs.current[index] = node }} className={`area-picker-option ${selected ? 'is-selected' : ''}`} type="button" role="option" aria-selected={selected} tabIndex={index === activeIndex ? 0 : -1} key={category.id} onClick={() => selectCategory(category)} onMouseEnter={() => setActiveIndex(index)}>
          <span className="area-option-icon"><Icon weight="duotone" size={22} /></span>
          <span><strong>{category.title}</strong><small>{category.items.length} inspection items</small></span>
          <Check className="area-option-check" weight="bold" size={18} />
        </button>
      })}
    </div>}
  </div>
}

function InspectionDetails({ details, onChange }) {
  const [open, setOpen] = useState(false)
  const fields = [
    ['address', 'Property address', 'text', '123 Example Street'], ['city', 'City', 'text', 'Toronto'],
    ['province', 'Province', 'text', 'Ontario'], ['builder', 'Builder name', 'text', 'Builder or developer'],
    ['date', 'Inspection date', 'date', ''], ['inspector', 'Inspector / homeowner', 'text', 'Your name'],
  ]
  return <section className="details-panel">
    <button className="details-toggle" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="inspection-details-fields"><span className="details-icon"><FileText weight="duotone" size={23} /></span><span><strong>Inspection details</strong><small>Add the property and inspector to your report</small></span><CaretDown className={open ? 'is-open' : ''} weight="bold" size={20} /></button>
    {open && <div id="inspection-details-fields" className="details-grid">
      {fields.map(([name, label, type, placeholder]) => <label key={name} className={name === 'address' ? 'field-wide' : ''}><span>{label}</span><input type={type} value={details[name] || ''} placeholder={placeholder} onChange={(event) => onChange(name, event.target.value)} /></label>)}
      <label><span>Property type</span><select value={details.propertyType || ''} onChange={(event) => onChange('propertyType', event.target.value)}><option value="">Select type</option><option>Detached</option><option>Semi-Detached</option><option>Townhouse</option><option>Condo</option><option>Other</option></select></label>
    </div>}
  </section>
}

function StatusFilter({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const filterRef = useRef(null)
  const optionRefs = useRef([])
  const options = [
    { value: 'all', label: 'All items', helper: 'Show every checklist item', Icon: GridFour },
    ...statusOptions.map(({ value: status }) => ({ value: status, ...friendlyStatuses[status] })),
  ]
  const selected = options.find((option) => option.value === value) || options[0]
  const SelectedIcon = selected.Icon

  useEffect(() => {
    if (!open) return undefined
    const handlePointerDown = (event) => {
      if (!filterRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  useEffect(() => {
    if (open) optionRefs.current[activeIndex]?.focus()
  }, [open, activeIndex])

  const showMenu = () => {
    setActiveIndex(Math.max(0, options.findIndex((option) => option.value === value)))
    setOpen(true)
  }

  const selectOption = (option) => {
    onChange(option.value)
    setOpen(false)
  }

  const handleMenuKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
      filterRef.current?.querySelector('.status-filter-trigger')?.focus()
      return
    }
    const nextIndex = event.key === 'Home' ? 0
      : event.key === 'End' ? options.length - 1
        : event.key === 'ArrowDown' ? (activeIndex + 1) % options.length
          : event.key === 'ArrowUp' ? (activeIndex - 1 + options.length) % options.length
            : null
    if (nextIndex !== null) {
      event.preventDefault()
      setActiveIndex(nextIndex)
    }
  }

  return <div className={`status-filter ${open ? 'is-open' : ''}`} ref={filterRef}>
    <button className="status-filter-trigger" type="button" aria-haspopup="listbox" aria-expanded={open} aria-controls="status-filter-menu" onClick={() => open ? setOpen(false) : showMenu()} onKeyDown={(event) => { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); showMenu() } }}>
      <span className={`status-filter-icon filter-${selected.value}`}><SelectedIcon weight="bold" size={20} /></span>
      <span className="status-filter-copy"><small>Show status</small><strong>{selected.label}</strong></span>
      <span className="status-filter-chevron"><CaretDown weight="bold" size={18} /></span>
    </button>
    {open && <div className="status-filter-menu" id="status-filter-menu" role="listbox" aria-label="Filter checklist by status" onKeyDown={handleMenuKeyDown}>
      {options.map((option, index) => {
        const Icon = option.Icon
        const isSelected = option.value === value
        return <button ref={(node) => { optionRefs.current[index] = node }} className={`status-filter-option filter-${option.value} ${isSelected ? 'is-selected' : ''}`} type="button" role="option" aria-selected={isSelected} tabIndex={index === activeIndex ? 0 : -1} key={option.value} onClick={() => selectOption(option)} onMouseEnter={() => setActiveIndex(index)}>
          <span className="status-filter-option-icon"><Icon weight="bold" size={18} /></span><span><strong>{option.label}</strong><small>{option.helper}</small></span><Check className="status-filter-check" weight="bold" size={17} />
        </button>
      })}
    </div>}
  </div>
}

function ChecklistTools({ filter, setFilter }) {
  return <div className="checklist-tools">
    <div className="checklist-instruction"><span><ClipboardText weight="duotone" size={24} /></span><p><strong>Choose one status for every item.</strong> Select “Has an issue” for anything the builder should review, then add a note or photo.</p></div>
    <StatusFilter value={filter} onChange={setFilter} />
  </div>
}

function StatusSelector({ item, value, onChange }) {
  return <fieldset className="status-selector"><legend className="sr-only">Choose a status for {item.title}</legend>
    {statusOptions.map(({ value: status }) => {
      const { label, helper, Icon } = friendlyStatuses[status]
      return <label key={status} className={`status-option status-${status} ${value === status ? 'selected' : ''}`}><input type="radio" name={`status-${item.id}`} value={status} checked={value === status} onChange={() => onChange(status)} /><span className="status-icon"><Icon weight="bold" size={20} /></span><span className="status-copy"><strong>{label}</strong><small>{helper}</small></span>{value === status && <Check className="status-selected-check" weight="bold" size={12} aria-hidden="true" />}</label>
    })}
  </fieldset>
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
    const handleKey = (event) => { if (event.key === 'Escape') setActivePhoto(null) }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [activePhoto])

  useEffect(() => {
    let active = true
    const urls = []
    Promise.all(photos.map(async (photoId) => {
      const blob = await photoStore.get(photoId)
      return blob ? [photoId, URL.createObjectURL(blob)] : null
    })).then((entries) => {
      const availableEntries = entries.filter(Boolean)
      if (!active) { availableEntries.forEach(([, url]) => URL.revokeObjectURL(url)); return }
      availableEntries.forEach(([, url]) => urls.push(url))
      setPreviews(Object.fromEntries(availableEntries))
    }).catch(() => { if (active) setError('A photo preview is unavailable.') })
    return () => { active = false; urls.forEach((url) => URL.revokeObjectURL(url)) }
  }, [photos])

  const upload = async (files) => {
    if (!files.length) return
    setBusy(true); setError('')
    const addedPhotos = []; const failures = []
    for (const file of files) {
      try {
        const blob = await compressPhoto(file)
        const photoId = `${itemId}-${crypto.randomUUID()}`
        await photoStore.set(photoId, blob)
        addedPhotos.push(photoId)
      } catch (uploadError) { failures.push(uploadError.message || `Unable to save ${file.name}.`) }
    }
    if (addedPhotos.length) onChange([...photos, ...addedPhotos])
    if (failures.length) setError(failures.join(' '))
    setBusy(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  const remove = async (photoId) => {
    setBusy(true); setError('')
    try { await photoStore.remove(photoId); onChange(photos.filter((id) => id !== photoId)) }
    catch { setError('Unable to remove this photo.') }
    finally { setBusy(false) }
  }

  return <div className="photo-attachment">
    <input ref={inputRef} className="sr-only" id={inputId} type="file" accept="image/jpeg,image/png,image/webp,image/heic" multiple disabled={busy} onChange={(event) => upload(Array.from(event.target.files || []))} />
    <div className="photo-gallery">
      {photos.map((photoId, index) => <div className="photo-tile" key={photoId}>{previews[photoId] ? <button className="photo-preview-button" type="button" onClick={() => setActivePhoto(photoId)} aria-label={`View inspection photo ${index + 1}`}><img src={previews[photoId]} alt="" /></button> : <span className="photo-placeholder"><Camera size={22} /></span>}<button className="photo-delete-button" type="button" onClick={() => remove(photoId)} disabled={busy} aria-label={`Remove photo ${index + 1}`}><Trash size={14} /></button></div>)}
      <label className={`photo-add-tile ${busy ? 'is-busy' : ''}`} htmlFor={inputId} aria-disabled={busy} tabIndex={busy ? -1 : 0} onKeyDown={(event) => { if (!busy && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); inputRef.current?.click() } }}><span className="photo-add-icon"><Plus weight="bold" size={19} /></span><span className="photo-add-copy"><strong>{busy ? 'Adding…' : 'Add photos'}</strong><small>{busy ? 'Processing photos' : 'JPG, PNG or HEIC'}</small></span></label>
    </div>
    {activePhoto && previews[activePhoto] && <div className="photo-viewer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setActivePhoto(null) }}><div className="photo-viewer-dialog" role="dialog" aria-modal="true" aria-label="Inspection photo preview"><button className="photo-viewer-close" type="button" onClick={() => setActivePhoto(null)} aria-label="Close photo preview" autoFocus><X size={20} /></button><img src={previews[activePhoto]} alt={`Enlarged inspection photo ${photos.indexOf(activePhoto) + 1}`} /><p>Photo {photos.indexOf(activePhoto) + 1} of {photos.length}</p></div></div>}
    <p className="photo-privacy"><ShieldCheck size={14} /> Stored only on this device</p>
    {error && <p className="inline-error" role="alert">{error}</p>}
  </div>
}

function ChecklistItem({ item, response, updateResponse }) {
  const [showDetails, setShowDetails] = useState(Boolean(response.note || response.photos.length || response.status === 'fail'))
  const detailsVisible = showDetails || response.status === 'fail' || Boolean(response.note || response.photos.length)
  return <article className={`checklist-item ${response.status === 'fail' ? 'is-failed' : ''}`}>
    <div className="item-copy"><h3>{item.title}</h3><p>{item.description}</p></div>
    <StatusSelector item={item} value={response.status} onChange={(status) => updateResponse(item.id, { status })} />
    {!detailsVisible ? <button className="add-note-button" type="button" onClick={() => setShowDetails(true)}><span className="add-note-icon"><Camera weight="duotone" size={22} /></span><span className="add-note-copy"><strong>Add note or photo</strong><small>Document an observation</small></span><span className="add-note-chevron"><CaretDown weight="bold" size={16} /></span></button> : <div className="item-details">{!response.note && !response.photos.length && response.status !== 'fail' && <button className="close-details" type="button" onClick={() => setShowDetails(false)} aria-label="Close details" title="Close details"><X weight="bold" size={15} /></button>}<label><span>{response.status === 'fail' ? 'What’s the issue?' : 'Add a note'} <small>optional</small></span><textarea value={response.note} onChange={(event) => updateResponse(item.id, { note: event.target.value })} placeholder={response.status === 'fail' ? 'Describe what you found…' : 'Add an observation or measurement…'} rows="3" /></label><PhotoAttachment itemId={item.id} photos={response.photos} onChange={(photos) => updateResponse(item.id, { photos })} /></div>}
  </article>
}

function ChecklistCategory({ category, items, expanded, onToggle, responseFor, updateResponse }) {
  const complete = category.items.filter((item) => responseFor(item.id).status !== 'not-tested').length
  const percent = category.items.length ? Math.round((complete / category.items.length) * 100) : 0
  const Icon = categoryIcons[category.icon] || House
  const panelId = `category-items-${category.id}`
  return <section className={`category ${expanded ? 'expanded' : ''}`} id={`category-${category.id}`}>
    <button className="category-header" type="button" onClick={onToggle} aria-expanded={expanded} aria-controls={panelId}><span className="category-icon"><Icon weight="duotone" size={29} /></span><span className="category-title"><strong>{category.title}</strong><small>{complete} of {category.items.length} items completed <span aria-hidden="true">•</span> {percent}%</small><span className="mini-progress"><span style={{ width: `${percent}%` }} /></span></span><CaretDown className={expanded ? 'is-open' : ''} weight="bold" size={22} /></button>
    {expanded && <div id={panelId} className="category-body"><div className="category-intro"><p>{category.description}</p>{category.banner && <strong>{category.banner}</strong>}{category.caution && <p className="caution"><WarningCircle weight="fill" size={20} /> <span>{category.caution}</span></p>}</div><div className="items-list">{items.map((item) => <ChecklistItem key={item.id} item={item} response={responseFor(item.id)} updateResponse={updateResponse} />)}</div></div>}
  </section>
}

function ConfirmDialog({ open, onCancel, onConfirm }) {
  useEffect(() => {
    if (!open) return undefined
    const handleKey = (event) => { if (event.key === 'Escape') onCancel() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onCancel])
  if (!open) return null
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel() }}><div className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="reset-title" aria-describedby="reset-description"><span className="dialog-icon"><WarningCircle weight="fill" size={24} /></span><h2 id="reset-title">Start a new inspection?</h2><p id="reset-description">This clears all property details, statuses, notes, and photos stored on this device. This cannot be undone.</p><div><button className="button button-secondary" onClick={onCancel} autoFocus>Cancel</button><button className="button button-danger" onClick={onConfirm}>Clear and start new</button></div></div></div>
}

function App() {
  const { state, summary, responseFor, updateDetails, updateResponse, toggleExpanded, resetInspection, saveStatus } = usePDIInspection()
  const [filter, setFilter] = useState('all')
  const [selectedCategoryId, setSelectedCategoryId] = useState('hvac')
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)
  const filtering = filter !== 'all'

  const visibleCategories = useMemo(() => checklistCategories.filter((category) => selectedCategoryId === 'all' || category.id === selectedCategoryId).map((category) => {
    const items = category.items.filter((item) => {
      const matchesFilter = filter === 'all' || responseFor(item.id).status === filter
      return matchesFilter
    })
    return { category, items }
  }).filter(({ items }) => items.length), [selectedCategoryId, filter, responseFor])

  const runExport = async (type) => {
    if (exporting) return
    setExporting(true); setExportError('')
    try {
      await new Promise((resolve) => setTimeout(resolve, 30))
      if (type === 'blank') await downloadBlankChecklist()
      else await downloadInspectionReport({ details: state.details, responses: state.responses, summary })
    } catch (error) {
      console.error(error)
      setExportError('We could not create the PDF. Please try again or use a different browser.')
    } finally { setExporting(false) }
  }

  const chooseArea = (id) => {
    setSelectedCategoryId(id)
    if (id !== 'all' && !state.expanded[id]) toggleExpanded(id)
    if (id !== 'all') window.setTimeout(() => document.getElementById(`category-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
  }

  return <>
    <PDIHeader onExport={() => runExport('report')} exporting={exporting} />
    <main id="top">
      <ProgressSummary summary={summary} />
      <section className="area-section" aria-labelledby="area-heading"><h2 id="area-heading">Choose an area</h2><AreaPicker value={selectedCategoryId} onChange={chooseArea} /></section>
      <section className="start-note"><span><House weight="duotone" size={28} /></span><p><strong>Start with systems that need time.</strong> Turn on heating, cooling (when conditions permit), hot water, and ventilation, then inspect the rest of the home while they run.</p></section>
      <InspectionDetails details={state.details} onChange={updateDetails} />
      <div className={`save-status save-${saveStatus}`} role="status"><span />{saveStatus === 'error' ? 'Unable to save locally' : saveStatus === 'saving' ? 'Saving…' : 'Saved on this device'}</div>
      {selectedCategoryId && <ChecklistTools filter={filter} setFilter={setFilter} />}
      {exportError && <div className="export-error" role="alert"><WarningCircle size={20} /> {exportError}</div>}
      <div className="categories-list">{visibleCategories.map(({ category, items }) => <ChecklistCategory key={category.id} category={category} items={items} expanded={filtering || state.expanded[category.id]} onToggle={() => { if (!filtering) toggleExpanded(category.id) }} responseFor={responseFor} updateResponse={updateResponse} />)}</div>
      {selectedCategoryId && !visibleCategories.length && <div className="empty-state"><WarningCircle size={28} /><h3>No checklist items found</h3><p>Choose a different status.</p><button className="button button-secondary" onClick={() => setFilter('all')}>Clear filter</button></div>}
      <section className="legal-note"><Info size={19} /><p>This checklist is a personal inspection aid, not an official Tarion or government product. Keep the builder’s official PDI form and consider a qualified professional inspection.</p></section>
      <footer><div><span className="footer-brand"><BrandMark /> Home PDI</span><p>Your inspection data and photos remain on this device.</p></div><div className="footer-actions"><button onClick={() => runExport('blank')} disabled={exporting}><FileText size={17} /> Blank checklist</button><button className="reset-button" onClick={() => setConfirmReset(true)}><Trash size={17} /> Start new inspection</button></div></footer>
    </main>
    <ConfirmDialog open={confirmReset} onCancel={() => setConfirmReset(false)} onConfirm={async () => { await resetInspection(); setConfirmReset(false); setFilter('all'); setSelectedCategoryId('hvac'); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />
  </>
}

export default App
