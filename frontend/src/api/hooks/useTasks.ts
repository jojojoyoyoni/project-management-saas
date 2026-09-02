import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { taskKeys, getTasks, updateTaskStatus } from '@/api/queries/taskQueries'
import type { TaskStatus } from '@/types/task'

export const useTasks = () => {
  return useQuery({
    queryKey: taskKeys.lists(),
    queryFn: getTasks,
    retry: 1,
  })
}

export const useUpdateTaskStatus = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: updateTaskStatus,
    onSuccess: () => {
      // Refresh the task list after dropping
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    }
  })
}
