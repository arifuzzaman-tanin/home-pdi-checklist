import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { allChecklistItems, checklistCategories } from '../data/pdiChecklist'
import { photoStore } from '../lib/photoStore'

const STORAGE_KEY = 'home-pdi-inspection-v1'
const SCHEMA_VERSION = 1

const today = () => {
  const date = new Date()
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10)
}

const blankDetails = () => ({
  address: '', city: '', province: 'Ontario', builder: '', date: today(), inspector: '', propertyType: '',
})

const defaultExpanded = () => Object.fromEntries(checklistCategories.map((category, index) => [category.id, index === 0]))

const initialState = () => ({
  version: SCHEMA_VERSION,
  details: blankDetails(),
  responses: {},
  expanded: defaultExpanded(),
})

const sanitizeLoadedState = (parsed) => {
  if (!parsed || typeof parsed !== 'object') return initialState()
  const validStatus = new Set(['pass', 'fail', 'not-tested', 'na'])
  const responses = {}
  if (parsed.responses && typeof parsed.responses === 'object') {
    for (const [id, response] of Object.entries(parsed.responses)) {
      if (!response || typeof response !== 'object') continue
      responses[id] = {
        status: validStatus.has(response.status) ? response.status : 'not-tested',
        note: typeof response.note === 'string' ? response.note.slice(0, 10000) : '',
        photos: Array.isArray(response.photos)
          ? response.photos.filter((photoId) => typeof photoId === 'string')
          : response.hasPhoto ? [id] : [],
      }
    }
  }
  return {
    version: SCHEMA_VERSION,
    details: { ...blankDetails(), ...(parsed.details && typeof parsed.details === 'object' ? parsed.details : {}) },
    responses,
    expanded: { ...defaultExpanded(), ...(parsed.expanded && typeof parsed.expanded === 'object' ? parsed.expanded : {}) },
  }
}

const loadInitialState = () => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored ? sanitizeLoadedState(JSON.parse(stored)) : initialState()
  } catch {
    return initialState()
  }
}

export function usePDIInspection() {
  const [state, setState] = useState(loadInitialState)
  const [saveStatus, setSaveStatus] = useState('saved')
  const saveTimer = useRef(null)

  useEffect(() => {
    window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
        setSaveStatus('saved')
      } catch {
        setSaveStatus('error')
      }
    }, 180)
    return () => window.clearTimeout(saveTimer.current)
  }, [state])

  const updateDetails = useCallback((field, value) => {
    setSaveStatus('saving')
    setState((current) => ({ ...current, details: { ...current.details, [field]: value } }))
  }, [])

  const updateResponse = useCallback((id, patch) => {
    setSaveStatus('saving')
    setState((current) => {
      const previous = current.responses[id] || { status: 'not-tested', note: '', photos: [] }
      return { ...current, responses: { ...current.responses, [id]: { ...previous, ...patch } } }
    })
  }, [])

  const toggleExpanded = useCallback((id) => {
    setSaveStatus('saving')
    setState((current) => ({ ...current, expanded: { ...current.expanded, [id]: !current.expanded[id] } }))
  }, [])

  const setAllExpanded = useCallback((expanded) => {
    setSaveStatus('saving')
    setState((current) => ({
      ...current,
      expanded: Object.fromEntries(checklistCategories.map((category) => [category.id, expanded])),
    }))
  }, [])

  const resetInspection = useCallback(async () => {
    try { await photoStore.clear() } catch { /* Photos may be unavailable. */ }
    setSaveStatus('saving')
    setState(initialState())
  }, [])

  const responseFor = useCallback((id) => state.responses[id] || { status: 'not-tested', note: '', photos: [] }, [state.responses])

  const summary = useMemo(() => {
    const counts = { total: allChecklistItems.length, pass: 0, fail: 0, 'not-tested': 0, na: 0, completed: 0, percent: 0 }
    for (const checklistItem of allChecklistItems) {
      const status = state.responses[checklistItem.id]?.status || 'not-tested'
      counts[status] += 1
      if (status !== 'not-tested') counts.completed += 1
    }
    counts.percent = counts.total ? Math.round((counts.completed / counts.total) * 100) : 0
    return counts
  }, [state.responses])

  return { state, saveStatus, summary, responseFor, updateDetails, updateResponse, toggleExpanded, setAllExpanded, resetInspection }
}
