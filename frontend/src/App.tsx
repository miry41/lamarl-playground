import TabInterface from './components/TabInterface'

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border px-6 py-2 flex items-center gap-3">
        <img src="/lm_logo.png" alt="LAMARL Logo" className="h-12 w-12" />
        <div>
          <h1 className="text-2xl font-bold">
            LAMARL Playground
          </h1>
          <p className="text-xs text-muted-foreground">
            LLM-Aided Multi-Agent Reinforcement Learning Visualization
          </p>
        </div>
      </header>

      {/* Main Content - Tab Interface */}
      <div className="h-[calc(100vh-60px)]">
        <TabInterface />
      </div>
    </div>
  )
}

export default App

