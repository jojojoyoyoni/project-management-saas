import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  taskKeys, 
  getTasks, 
  getTaskDetails, 
  updateTaskStatus, 
  updateTask, 
  createTask, 
  getTaskActivities,
  deleteTask,
  getTaskStatuses,
  createTaskStatus
} from '@/api/queries/taskQueries'
import type { TaskStatus } from '@/types/task'

export const useTasks = (projectId: string | null) => {
  return useQuery({
    queryKey: taskKeys.list(projectId || ''),
    queryFn: () => getTasks(projectId!),
    enabled: !!projectId,
    retry: 1,
  })
}

export const useTaskDetails = (projectId: string | null, taskId: string | null) => {
  return useQuery({
    queryKey: taskKeys.detail(projectId || '', taskId || ''),
    queryFn: () => getTaskDetails(projectId!, taskId!),
    enabled: !!projectId && !!taskId,
  })
}

export const useUpdateTaskStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, taskId, status }: { projectId: string; taskId: string; status: TaskStatus }) => {
      return updateTaskStatus({ projectId, taskId, status })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    }
  })
}

export const useUpdateTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, taskId, taskData }: { projectId: string; taskId: string; taskData: any }) => {
      return updateTask({ projectId, taskId, taskData })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    }
  })
}

export const useCreateTask = (projectId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (taskData: any) => createTask({ projectId, taskData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list(projectId) })
    }
  })
}



export const useDeleteTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, taskId }: { projectId: string; taskId: string }) => {
      return deleteTask({ projectId, taskId })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    }
  })
}

export const useTaskActivities = (projectId: string | null, taskId: string | null) => {
  return useQuery({
    queryKey: ['taskActivities', taskId],
    queryFn: () => getTaskActivities(projectId!, taskId!),
    enabled: !!projectId && !!taskId,
  })
}


export const useTaskStatuses = (projectId: string | null) => {
  return useQuery({
    queryKey: ['taskStatuses', projectId],
    queryFn: () => getTaskStatuses(projectId!),
    enabled: !!projectId,
  })
}

export const useCreateTaskStatus = (projectId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (statusData: { name: string; color: string }) => createTaskStatus({ projectId, statusData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taskStatuses', projectId] })
    }
  })
}