import { useEffect, useState } from "preact/hooks"

export function Files() {
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    const element: HTMLElement | null = document.querySelector('#doodle-overlay-wrapper')
    if (!element) {
      return
    }
    function clickHandler() {
      setShowDropdown(false)
    }
    element.addEventListener('click', clickHandler)
    return () => element.removeEventListener('click', clickHandler)
  }, [])

  return (
    <div className="files">
      <div className="row">
        <button className="with-bg" onClick={() => setShowDropdown(prev => !prev)}>
          <i class="bi bi-list"></i>
        </button>
        <button className="active w-auto">
          Share
          <i class="bi bi-lock"></i>
        </button>
      </div>
      {showDropdown && (
        <div className="card card-col dropdown">
          <button className="dropdown-button">
            New Document
          </button>
          <button className="dropdown-button">
            Import JSON
          </button>
          <button className="dropdown-button">
            Export JSON
          </button>
          <button className="dropdown-button">
            Export SVG
          </button>
          <button className="dropdown-button">
            Export PNG
          </button>
        </div>
      )}
    </div>
  )
}
