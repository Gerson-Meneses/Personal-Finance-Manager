import { useState } from "react"

interface Props<T> {
  onSubmit: (data: Partial<T>) => Promise<T | void>
  children: (
    props: {
      loading: boolean
      error: string | null
      handleSubmit: (data: T | Partial<T>) => Promise<T | void>
    }
  ) => React.ReactNode
}

const detailsToText = (details: any) => {
  let text = "";
  for (const key in details) {
    text += `${key}:\n`;
    details[key].forEach((item: any) => {
      text += `- ${item}\n`;
    });
  }
  return text;
}

export default function FormWrapper<T>({
  onSubmit,
  children
}: Props<T>) {

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (data: Partial<T>) => {

    try {

      setError(null)
      setLoading(true)

      await onSubmit(data)

    } catch (err: any) {

      if (err?.error?.message === "Errores de validación") {
        console.log(err?.error?.message === "Errores de validación")
        const messages = detailsToText(err.error.details)
        setError(messages)
        return
      } else {
        setError(err.error.message?.toString() || "Error al enviar el formulario")
      }


    } finally {

      setLoading(false)

    }

  }

  return children({
    loading,
    error,
    handleSubmit
  })
}