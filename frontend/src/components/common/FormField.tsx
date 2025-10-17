import { Label, Input, Select } from '@/components/ui'
import type { InputHTMLAttributes, SelectHTMLAttributes } from 'react'

interface BaseFormFieldProps {
  label: string
  children?: React.ReactNode
}

type InputFieldProps = BaseFormFieldProps &
  InputHTMLAttributes<HTMLInputElement> & {
    type?: 'text' | 'number' | 'email' | 'password' | 'url' | 'tel' | 'search' | 'date' | 'time' | 'datetime-local' | 'month' | 'week'
  }

type SelectFieldProps = BaseFormFieldProps &
  SelectHTMLAttributes<HTMLSelectElement> & {
    type: 'select'
  }

export default function FormField(props: InputFieldProps | SelectFieldProps) {
  const { label, type = 'text', children, ...rest } = props

  return (
    <div>
      <Label className="mb-1">{label}</Label>
      {type === 'select' ? (
        <Select {...(rest as SelectHTMLAttributes<HTMLSelectElement>)}>
          {children}
        </Select>
      ) : (
        <Input type={type as string} {...(rest as InputHTMLAttributes<HTMLInputElement>)} />
      )}
    </div>
  )
}

