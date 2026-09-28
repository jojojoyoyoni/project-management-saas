import { useRef } from 'react'
import { useTaskAttachments, useUploadAttachment } from '@/api/hooks/useTasks'
import { FaPaperclip, FaFilePdf, FaImage, FaFileWord, FaTrash } from 'react-icons/fa6'
import Spinner from '@/components/common/Spinner'

interface TaskAttachmentsProps {
  projectId: string
  taskId: string
}

export default function TaskAttachments({ projectId, taskId }: TaskAttachmentsProps) {
  const { data: attachments, isLoading } = useTaskAttachments(projectId, taskId)
  const uploadAttachment = useUploadAttachment(projectId, taskId)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadAttachment.mutate(file)
      e.target.value = '' // Reset input
    }
  }

  const getIcon = (filename: string) => {
    if (filename.match(/\.(jpg|jpeg|png|gif)$/i)) return <FaImage className="text-blue-500" />
    if (filename.match(/\.(pdf)$/i)) return <FaFilePdf className="text-red-500" />
    if (filename.match(/\.(doc|docx)$/i)) return <FaFileWord className="text-indigo-500" />
    return <FaPaperclip className="text-gray-500" />
  }

  if (isLoading) return <div className="flex justify-center py-4"><Spinner /></div>

  return (
    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Attachments</h3>
      
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileChange} 
      />
      
      <button 
        onClick={() => fileInputRef.current?.click()}
        disabled={uploadAttachment.isPending}
        className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center justify-center gap-2 mb-4 disabled:opacity-50"
      >
        <FaPaperclip /> 
        {uploadAttachment.isPending ? 'Uploading...' : 'Click to upload PDF, Image, or Document'}
      </button>

      {attachments && attachments.length > 0 ? (
        <div className="space-y-2">
          {attachments.map((att: any) => (
            <div key={att.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="text-xl">{getIcon(att.filename)}</div>
                <div className="overflow-hidden">
                  <a 
                    href={att.file} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-sm font-medium text-gray-900 dark:text-white hover:underline truncate block"
                  >
                    {att.filename}
                  </a>
                  <p className="text-xs text-gray-400">
                    {(att.file_size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-2">No files attached yet.</p>
      )}
    </div>
  )
}