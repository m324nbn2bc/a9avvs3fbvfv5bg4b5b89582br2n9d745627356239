// Custom hook for secure storage operations
import { useState, useCallback } from 'react'
import { uploadFile, uploadFileWithProgress, getSignedUrl, deleteFile, listFiles } from '../lib/supabase'
import { useAuth } from './useAuth'

export const useSecureStorage = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(0)

  const handleError = useCallback((error) => {
    console.error('Storage operation error:', error)
    setError(error.message || 'An error occurred')
    return null
  }, [])

  const upload = useCallback(async (file, folder = 'uploads', withProgress = false) => {
    if (!user) {
      throw new Error('User must be authenticated to upload files')
    }

    setLoading(true)
    setError(null)
    setProgress(0)

    try {
      let result
      if (withProgress) {
        result = await uploadFileWithProgress(file, folder, setProgress)
      } else {
        result = await uploadFile(file, folder)
      }
      
      setProgress(100)
      return result
    } catch (error) {
      return handleError(error)
    } finally {
      setLoading(false)
    }
  }, [user, handleError])

  const getUrl = useCallback(async (path, expiresIn = 3600) => {
    if (!user) {
      throw new Error('User must be authenticated to access files')
    }

    setLoading(true)
    setError(null)

    try {
      return await getSignedUrl(path, expiresIn)
    } catch (error) {
      return handleError(error)
    } finally {
      setLoading(false)
    }
  }, [user, handleError])

  const remove = useCallback(async (path) => {
    if (!user) {
      throw new Error('User must be authenticated to delete files')
    }

    setLoading(true)
    setError(null)

    try {
      return await deleteFile(path)
    } catch (error) {
      return handleError(error)
    } finally {
      setLoading(false)
    }
  }, [user, handleError])

  const list = useCallback(async (folder = 'uploads', limit = 100, offset = 0) => {
    if (!user) {
      throw new Error('User must be authenticated to list files')
    }

    setLoading(true)
    setError(null)

    try {
      return await listFiles(folder, limit, offset)
    } catch (error) {
      return handleError(error)
    } finally {
      setLoading(false)
    }
  }, [user, handleError])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    // State
    loading,
    error,
    progress,
    
    // Actions
    upload,
    getUrl,
    remove,
    list,
    clearError,
    
    // Utils
    isAuthenticated: !!user
  }
}

export default useSecureStorage