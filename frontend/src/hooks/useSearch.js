import { useState, useCallback, useRef } from 'react'

/*
 * Debounced search hook.
 * @param {number} delay - Debounce delay in ms (default 400ms)
 * @returns {{ query, setQuery, debouncedQuery }}
 */
export function useSearch(delay = 400) {
  const [query, setQueryRaw] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const timer = useRef(null)

  const setQuery = useCallback((val) => {
    setQueryRaw(val)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setDebouncedQuery(val), delay)
  }, [delay])

  return { query, setQuery, debouncedQuery }
}
