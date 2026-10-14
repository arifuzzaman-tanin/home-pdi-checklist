const DB_NAME = 'home-pdi-photos-v1'
const STORE_NAME = 'photos'

const openDatabase = () => new Promise((resolve, reject) => {
  if (!('indexedDB' in window)) return reject(new Error('Photo storage is not supported by this browser.'))
  const request = indexedDB.open(DB_NAME, 1)
  request.onupgradeneeded = () => {
    if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME)
  }
  request.onsuccess = () => resolve(request.result)
  request.onerror = () => reject(request.error || new Error('Unable to open photo storage.'))
})

const transact = async (mode, action) => {
  const db = await openDatabase()
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, mode)
      const request = action(transaction.objectStore(STORE_NAME))
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error || new Error('Photo storage operation failed.'))
    })
  } finally {
    db.close()
  }
}

export const photoStore = {
  get: (id) => transact('readonly', (store) => store.get(id)),
  set: (id, blob) => transact('readwrite', (store) => store.put(blob, id)),
  remove: (id) => transact('readwrite', (store) => store.delete(id)),
  clear: () => transact('readwrite', (store) => store.clear()),
}

export const compressPhoto = (file) => new Promise((resolve, reject) => {
  if (!file.type.startsWith('image/')) return reject(new Error('Choose an image file.'))
  if (file.size > 15 * 1024 * 1024) return reject(new Error('Photo must be smaller than 15 MB.'))

  const image = new Image()
  const objectUrl = URL.createObjectURL(file)
  image.onload = () => {
    URL.revokeObjectURL(objectUrl)
    const maxDimension = 1280
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    const context = canvas.getContext('2d')
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Unable to process this photo.')), 'image/jpeg', 0.78)
  }
  image.onerror = () => {
    URL.revokeObjectURL(objectUrl)
    reject(new Error('Unable to read this image.'))
  }
  image.src = objectUrl
})

export const blobToDataUrl = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(reader.result)
  reader.onerror = () => reject(reader.error)
  reader.readAsDataURL(blob)
})
