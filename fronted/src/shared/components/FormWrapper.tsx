import { useState } from "react"

interface Props<T> {
  onSubmit: (data: Partial<T>) => Promise<T|void>
  children: (
    props: {
      loading: boolean
      error: string | null
      handleSubmit:  (data: T|Partial<T>) => Promise<T|void>
    }
  ) => React.ReactNode
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

      setError(err?.error.message ?? "Error")

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