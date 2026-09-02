import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createProjectSchema, type CreateProjectValues } from '@/types/project'
import { useCreateProject } from '@/api/hooks/useProjects'
import Input from '@/components/common/Input'
import Spinner from '@/components/common/Spinner'

interface ProjectFormProps {
  onSuccess: () => void
}

export default function ProjectForm({ onSuccess }: ProjectFormProps) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<CreateProjectValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { name: '', key: '', description: '' }
  })

  const createMutation = useCreateProject()

  const onSubmit = (data: CreateProjectValues) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        reset()
        onSuccess()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Project Name"
        placeholder="e.g., Website Redesign"
        error={errors.name?.message}
        {...register('name')}
      />

      <Input
        label="Project Key"
        placeholder="e.g., WEB"
        error={errors.key?.message}
        {...register('key')}
      />
      <p className="text-xs text-gray-500 -mt-2">Uppercase letters only, max 10 chars.</p>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description (Optional)
        </label>
        <textarea
          rows={3}
          placeholder="What is this project about?"
          className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700"
          {...register('description')}
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t dark:border-gray-700">
        <button
          type="button"
          onClick={onSuccess}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center"
        >
          {createMutation.isPending ? <Spinner className="h-4 w-4 mr-2 text-white" /> : null}
          Create Project
        </button>
      </div>

      {createMutation.isError && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {createMutation.error.message || 'Failed to create project.'}
        </p>
      )}
    </form>
  )
}
