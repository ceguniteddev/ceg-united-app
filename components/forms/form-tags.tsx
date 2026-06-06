 
import { Control, useController } from "react-hook-form"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { useState } from "react"

export const getTagColor = (index: number) => {
  const colors = [
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 hover:bg-red-200 border-red-200",
    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 hover:bg-orange-200 border-orange-200",
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 hover:bg-amber-200 border-amber-200",
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 hover:bg-green-200 border-green-200",
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-200 border-blue-200",
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 hover:bg-indigo-200 border-indigo-200",
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 hover:bg-purple-200 border-purple-200",
    "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300 hover:bg-pink-200 border-pink-200",
  ]
  return colors[index % colors.length]
}

interface FormTagsProps {
  control: Control<any>
  name: string
  label: string
  placeholder?: string
}

export function FormTags({ control, name, label, placeholder }: FormTagsProps) {
  const { field } = useController({ name, control })
  const [inputValue, setInputValue] = useState("")

  const tags: string[] = Array.isArray(field.value) ? field.value : []

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      const newTag = inputValue.trim()
      if (newTag && !tags.includes(newTag)) {
        field.onChange([...tags, newTag])
      }
      setInputValue("")
    }
  }

  const removeTag = (indexToRemove: number) => {
    field.onChange(tags.filter((_, index) => index !== indexToRemove))
  }

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <div className="w-full">
        <div className="flex flex-col gap-2">
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className={`flex items-center gap-1 pr-1 ${getTagColor(index)}`}
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(index)}
                    className="ml-1 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <Input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
          />
          <p className="text-[0.8rem] text-muted-foreground">
            Press enter or comma to add a tag
          </p>
        </div>
      </div>
    </Field>
  )
}
