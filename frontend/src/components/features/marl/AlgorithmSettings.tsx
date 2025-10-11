import { Select, Label } from '@/components/ui'

export default function AlgorithmSettings() {
  return (
    <section>
      <h3 className="text-sm font-semibold mb-3 text-foreground">Algorithm</h3>
      <Select className="w-full">
        <option value="maddpg">MADDPG (Default)</option>
        <option value="mappo">MAPPO</option>
        <option value="qmix">QMIX</option>
      </Select>

      <div className="mt-4">
        <h4 className="text-sm font-semibold mb-3 text-foreground">Network Architecture</h4>
        <div className="space-y-3">
          <div>
            <Label>Actor Network</Label>
            <div className="text-xs bg-muted/50 p-2 rounded mt-1">
              Leaky ReLU / Tanh MLPs
            </div>
          </div>
          <div>
            <Label>Critic Network</Label>
            <div className="text-xs bg-muted/50 p-2 rounded mt-1">
              Simplified to Q(o_i, a_i)
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

