import { FormField } from '@/components/common'

export default function TrainingParameters() {
  return (
    <section>
      <h3 className="text-sm font-semibold mb-3 text-foreground">Training Parameters</h3>
      <div className="space-y-3">
        {/* Training Scale */}
        <div className="border-b pb-3">
          <h4 className="text-xs font-semibold text-muted-foreground mb-2">Training Scale</h4>
          <FormField
            label="Episodes"
            type="number"
            defaultValue="3000"
            step={100}
          />
          <FormField
            label="Episode Length"
            type="number"
            defaultValue="200"
            step={10}
          />
          <FormField
            label="Batch Size"
            type="number"
            defaultValue="512"
            step={64}
          />
        </div>

        {/* Learning Rates */}
        <div className="border-b pb-3">
          <h4 className="text-xs font-semibold text-muted-foreground mb-2">Learning Rates</h4>
          <FormField
            label="Actor LR"
            type="number"
            defaultValue="0.0001"
            step={0.00001}
          />
          <FormField
            label="Critic LR"
            type="number"
            defaultValue="0.001"
            step={0.0001}
          />
        </div>

        {/* Core Parameters */}
        <div className="border-b pb-3">
          <h4 className="text-xs font-semibold text-muted-foreground mb-2">Core Parameters</h4>
          <FormField
            label="Gamma (γ) - Discount"
            type="number"
            defaultValue="0.99"
            step={0.01}
          />
          <FormField
            label="Alpha (α) - Prior Weight"
            type="number"
            defaultValue="0.1"
            step={0.01}
          />
        </div>

        {/* Network Architecture */}
        <div className="border-b pb-3">
          <h4 className="text-xs font-semibold text-muted-foreground mb-2">Network Architecture</h4>
          <FormField
            label="Hidden Layers"
            type="number"
            defaultValue="3"
            step={1}
          />
          <FormField
            label="Hidden Units"
            type="number"
            defaultValue="180"
            step={10}
          />
        </div>

        {/* Exploration */}
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground mb-2">Exploration</h4>
          <FormField
            label="Exploration Rate"
            type="number"
            defaultValue="0.6"
            step={0.1}
          />
          <FormField
            label="Noise Scale"
            type="number"
            defaultValue="0.1"
            step={0.01}
          />
        </div>
      </div>
    </section>
  )
}

