import { FormField } from '@/components/common'

export default function EnvironmentSettings() {
  return (
    <section>
      <h3 className="text-sm font-semibold mb-3 text-foreground">Environment</h3>
      <div className="space-y-3">
        <FormField
          label="Number of Robots"
          type="number"
          defaultValue={30}
          min={5}
          max={50}
        />
        <FormField
          label="Sensing Radius"
          type="number"
          defaultValue={0.4}
          step={0.1}
        />
        <FormField
          label="Avoidance Radius"
          type="number"
          defaultValue={0.1}
          step={0.05}
        />
      </div>
    </section>
  )
}

