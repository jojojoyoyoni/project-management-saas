import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useUpdateOrganization } from '@/api/hooks/useOrganizations'
import Button from '@/components/common/Button'
import { FaImage, FaUpload } from 'react-icons/fa6'

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
  const [logo, setLogo] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>(currentLogo || '')
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Logo Upload & Preview */}
      <div className="flex flex-col items-center text-center pb-4 border-b border-gray-100 dark:border-gray-700">
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
        
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-3">Update Organization</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Organization Name</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
            {...register('name')}
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (Optional)</label>
          <textarea
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
            {...register('description')}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" isLoading={updateOrg.isPending}>Save Changes</Button>
      </div>
    </form>
  )
}