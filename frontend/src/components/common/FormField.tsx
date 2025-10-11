import { Label, Input, Select } from '@/components/ui'
import { InputHTMLAttributes, SelectHTMLAttributes } from 'react'

interface FormFieldProps {
  label: string
  type?: 'input' | 'select'
  children?: React.ReactNode
}

type InputFieldProps = FormFieldProps &
  InputHTMLAttributes<HTMLInputElement> & {
    type?: 'input'
  }

type SelectFieldProps = FormFieldProps &
  SelectHTMLAttributes<HTMLSelectElement> & {
    type: 'select'
  }

export default function FormField(props: InputFieldProps | SelectFieldProps) {
  const { label, type = 'input', children, ...rest } = props

  return (
    <div>
      <Label className="mb-1">{label}</Label>
      {type === 'select' ? (
        <Select {...(rest as SelectHTMLAttributes<HTMLSelectElement>)}>
          {children}
        </Select>
      ) : (
        <Input {...(rest as InputHTMLAttributes<HTMLInputElement>)} />
      )}
    </div>
  )
}

