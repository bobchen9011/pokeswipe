const STORAGE_KEY = 'pokeswipe_uid'

function generate() {
  return 'pks_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}

export function getIdentity() {
  let id = localStorage.getItem(STORAGE_KEY)
  if (!id || id.length < 8) {
    id = generate()
    localStorage.setItem(STORAGE_KEY, id)
  }
  return id
}

export function getShortIdentity() {
  return getIdentity().slice(-6).toUpperCase()
}
