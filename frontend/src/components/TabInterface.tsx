import { useState, createContext, useContext } from 'react'
import { Brain, Bot } from 'lucide-react'
import { LLMModuleRefactored } from './features/llm'
import { MARLModuleRefactored } from './features/marl'

type TabType = 'llm' | 'marl'

interface TabContextType {
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
}

const TabContext = createContext<TabContextType | null>(null)

export const useTabNavigation = () => {
  const context = useContext(TabContext)
  if (!context) {
    throw new Error('useTabNavigation must be used within TabInterface')
  }
  return context
}

export default function TabInterface() {
  const [activeTab, setActiveTab] = useState<TabType>('llm')

  return (
    <TabContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="w-full h-full flex flex-col">
        {/* Tab Navigation */}
        <div className="border-b border-border bg-card">
          <div className="flex justify-center">
            <div className="flex w-full max-w-4xl">
              <button
                onClick={() => setActiveTab('llm')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium transition-colors relative ${
                  activeTab === 'llm'
                    ? 'text-primary bg-background'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Brain size={16} />
                LLM Module
                {activeTab === 'llm' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('marl')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium transition-colors relative ${
                  activeTab === 'marl'
                    ? 'text-primary bg-background'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Bot size={16} />
                MARL Module
                {activeTab === 'marl' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'llm' && <LLMModuleRefactored />}
          {activeTab === 'marl' && <MARLModuleRefactored />}
        </div>
      </div>
    </TabContext.Provider>
  )
}

