import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useUpdateOrganization } from '@/api/hooks/useOrganizations'
import { apiClient } from '@/api/client'
import Button from '@/components/common/Button'
import { FaImage, FaUpload, FaTrash } from 'react-icons/fa6'
import { useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'

const orgSchema = z.object({
  name: z.string().min(3, 'Organization name must be at least 3 characters'),
  description: z.string().optional(),
})

type OrgFormValues = z.infer<typeof orgSchema>

interface UpdateOrganizationModalProps {
  orgId: string
  currentName: string
  currentDescription: string
  currentLogo: string | null
  onClose: () => void
}

export default function UpdateOrganizationModal({ 
  orgId, 
  currentName, 
  currentDescription, 
  currentLogo, 
  onClose 
}: UpdateOrganizationModalProps) {
  const updateOrg = useUpdateOrganization()
  const queryClient = useQueryClient()
  const [logo, setLogo] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>(currentLogo || '')
  const [isDeleting, setIsDeleting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrgFormValues>({
    resolver: zodResolver(orgSchema),
    defaultValues: {
      name: currentName,
      description: currentDescription,
    }
  })

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogo(file)
      setLogoPreview(URL.createObjectURL(file))
    }
  }

  const onSubmit = (data: OrgFormValues) => {
    const formData = new FormData()
    formData.append('name', data.name)
    if (data.description) formData.append('description', data.description)
    if (logo) formData.append('logo', logo)

    updateOrg.mutate({ orgId, data: formData }, {
      onSuccess: () => onClose()
    })
  }

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to archive "${currentName}"? All projects and tasks will be hidden.`)) {
      setIsDeleting(true)
      try {
        await apiClient(`/organizations/${orgId}/`, { method: 'DELETE' })
        queryClient.invalidateQueries({ queryKey: ['organizations'] })
        onClose()
      } catch (error) {
        console.error("Failed to archive organization", error)
      } finally {
        setIsDeleting(false)
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header & Logo Upload Area */}
      <div className="flex flex-col items-center text-center pb-6 border-b border-gray-100 dark:border-gray-700">
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-md mb-3 cursor-pointer relative overflow-hidden group"
        >
          {logoPreview ? (
            <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover" />
          ) : (
            currentName?.[0]?.toUpperCase() || '🏢'
          )}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <FaImage className="text-white text-2xl" />
          </div>
        </div>
        
        <button 
          type="button" 
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
        >
          <FaUpload className="h-3 w-3" />
          {logo ? 'Change Logo' : 'Upload Logo'}
        </button>

        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*"
          onChange={handleLogoChange}
        />
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Organization Name</label>
          <input
            type="text"
            className={clsx(
              "w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500",
              errors.name ? "border-red-500" : "border-gray-300 dark:border-gray-600"
            )}
            {...register('name')}
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (Optional)</label>
          <textarea
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            {...register('description')}
          />
        </div>
      </div>

      {/* Danger Zone (Moved to Bottom) */}
      <div className="border border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50/50 dark:bg-red-900/10">
        <h3 className="text-sm font-semibold text-red-700 dark:text-red-400 uppercase tracking-wider mb-2">Danger Zone</h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Archiving will hide this organization and all its projects.</p>
          <button 
            type="button" 
            onClick={handleDelete} 
            disabled={isDeleting}
            className="flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full sm:w-auto disabled:opacity-50"
          >
            <FaTrash className="h-3 w-3" /> Archive Org
          </button>
        </div>
      </div>

      {/* Footer Actions (Responsive Stacking) */}
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
        <Button type="button" variant="secondary" onClick={onClose} className="w-full sm:w-auto">
          Cancel
        </Button>
        <Button type="submit" isLoading={updateOrg.isPending} className="w-full sm:w-auto">
          Save Changes
        </Button>
      </div>
    </form>
  )
}