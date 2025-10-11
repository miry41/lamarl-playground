interface TaskInputProps {
  value: string
  onChange: (value: string) => void
}

export default function TaskInput({ value, onChange }: TaskInputProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-20 px-3 py-2 text-sm border border-border rounded bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      placeholder="Describe the multi-robot task..."
    />
  )
}

