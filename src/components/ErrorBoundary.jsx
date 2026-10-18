import { Component } from 'react'

// If one page crashes (for example because of a hand-edited backup file) the rest of Stardesk keeps working.
export default class ErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    console.error('Stardesk page error:', error)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <section className="win crashbox" role="alert">
        <header className="win-bar">
          <h2>Oops – this page hit a problem</h2>
        </header>
        <div className="win-body">
          <p>Your data is safe in this browser. Try another page, or reload. If it keeps happening, export a backup from Settings and re-import it.</p>
          <div className="row wrap">
            <a className="btn small" href="#home">
              Go Home
            </a>
            <a className="btn small ghost" href="#settings">
              Settings &amp; backup
            </a>
            <button className="btn small ghost" onClick={() => window.location.reload()}>
              Reload
            </button>
          </div>
        </div>
      </section>
    )
  }
}