import { useState } from 'react'
import ScanTab from './components/ScanTab.jsx'
import PasteTab from './components/PasteTab.jsx'

const TABS = [
  { id: 'scan', label: 'Barcode' },
  { id: 'paste', label: 'Ingredients' },
]

function App() {
  const [activeTab, setActiveTab] = useState('scan')

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Food Decoder</h1>
        <p className="app-tagline">
          Understand what&apos;s in your food — no account required
        </p>
        <nav className="tabs" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`tab ${activeTab === tab.id ? 'tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="app-main">
        {activeTab === 'scan' && (
          <ScanTab onGoToPaste={() => setActiveTab('paste')} />
        )}
        {activeTab === 'paste' && <PasteTab />}
      </main>
    </div>
  )
}

export default App
