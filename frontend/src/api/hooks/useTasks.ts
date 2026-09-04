import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { taskKeys, getTasks, updateTaskStatus, createTask } from '@/api/queries/taskQueries'
import type { TaskStatus } from '@/types/task'

export const useTasks = (projectId: string | null) => {
  return useQuery({
    queryKey: taskKeys.list(projectId || ''),
    queryFn: () => getTasks(projectId!), // Removed orgId from here
    enabled: !!projectId,
    retry: 1,
  })
}

export const useUpdateTaskStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, taskId, status }: { projectId: string; taskId: string; status: TaskStatus }) => {
      return updateTaskStatus({ projectId, taskId, status }) // Removed orgId from here
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    }
  })
}

// ADD THIS: Create Task Hook
export const useCreateTask = (projectId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (taskData: any) => createTask({ projectId, taskData }),
    onSuccess: () => {
      // Invalidate the tasks list so the board refreshes automatically
      queryClient.invalidateQueries({ queryKey: taskKeys.list(projectId) })
    }
  })
}
