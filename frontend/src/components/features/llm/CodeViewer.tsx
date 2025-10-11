import { FileCode, Copy, Download } from 'lucide-react'
import { Card, CardHeader, CardContent, Button } from '@/components/ui'

interface CodeViewerProps {
  code: string
  showSuccessRate?: boolean
}

export default function CodeViewer({ code, showSuccessRate }: CodeViewerProps) {
  return (
    <>
      <CardHeader className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode size={16} className="text-primary" />
            <h3 className="text-sm font-semibold">Generated Code</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" shape="default" className="p-1.5 h-auto w-auto">
              <Copy size={14} />
            </Button>
            <Button variant="ghost" size="icon" shape="default" className="p-1.5 h-auto w-auto">
              <Download size={14} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-auto p-0">
        {code ? (
          <div className="p-4">
            <Card>
              <CardHeader className="p-3">
                <span className="text-xs font-mono text-muted-foreground">
                  policy_prior.py
                </span>
              </CardHeader>
              <CardContent className="p-4">
                <pre className="text-xs font-mono overflow-x-auto">
                  <code className="text-foreground">{code}</code>
                </pre>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center text-muted-foreground min-h-[400px]">
            <div>
              <FileCode size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-sm">Generated code will appear here</p>
              <p className="text-xs mt-1">Click "Generate Functions" to start</p>
            </div>
          </div>
        )}
      </CardContent>

      {showSuccessRate && (
        <div className="border-t border-border p-4 bg-card">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">LLM Success Rate</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-green-600">+28.5-67.5%</span>
              <span className="text-xs text-muted-foreground">vs. baseline</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

