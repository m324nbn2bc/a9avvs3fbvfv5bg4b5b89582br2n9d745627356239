"use client";

// Secure client-side storage utilities using server-side API
import { auth } from './firebase-optimized'

// Helper function to get Firebase ID token
const getAuthToken = async () => {
  if (!auth?.currentUser) {
    throw new Error('User not authenticated')
  }
  return await auth.currentUser.getIdToken()
}

// Helper function to make authenticated API requests
const apiRequest = async (endpoint, options = {}) => {
  const token = await getAuthToken()
  
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Request failed')
  }

  return response.json()
}

// Secure file upload using signed URLs
export const uploadFile = async (file, folder = 'uploads') => {
  try {
    // Step 1: Get signed upload URL from server
    const { uploadUrl, path, token } = await apiRequest('/api/storage/upload-url', {
      method: 'POST',
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        folder
      })
    })

    // Step 2: Upload file directly to Supabase using signed URL and token
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
        'x-upsert': 'false'
      }
    })

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload file: ${uploadResponse.status} ${uploadResponse.statusText}`)
    }

    return {
      path,
      fullPath: path,
      name: file.name,
      size: file.size,
      type: file.type
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error uploading file:', error);
    }
    throw error
  }
}

// Get signed URL for private file access
export const getSignedUrl = async (path, expiresIn = 3600) => {
  try {
    const { signedUrl } = await apiRequest('/api/storage/signed-url', {
      method: 'POST',
      body: JSON.stringify({ path, expiresIn })
    })

    return signedUrl
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error getting signed URL:', error);
    }
    throw error
  }
}

// Delete file securely
export const deleteFile = async (path) => {
  try {
    await apiRequest('/api/storage/delete', {
      method: 'DELETE',
      body: JSON.stringify({ path })
    })

    return true
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error deleting file:', error);
    }
    throw error
  }
}

// List user's files
export const listFiles = async (folder = 'uploads', limit = 100, offset = 0) => {
  try {
    const params = new URLSearchParams({ folder, limit: limit.toString(), offset: offset.toString() })
    const { files } = await apiRequest(`/api/storage/list?${params}`, {
      method: 'GET'
    })

    return files
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error listing files:', error);
    }
    throw error
  }
}

// Utility function for handling file uploads with progress
export const uploadFileWithProgress = async (file, folder = 'uploads', onProgress) => {
  try {
    // Get signed upload URL
    const { uploadUrl, path } = await apiRequest('/api/storage/upload-url', {
      method: 'POST',
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        folder
      })
    })

    // Upload with progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100
          onProgress(progress)
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          resolve({
            path,
            fullPath: path,
            name: file.name,
            size: file.size,
            type: file.type
          })
        } else {
          reject(new Error('Upload failed'))
        }
      })

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'))
      })

      xhr.open('PUT', uploadUrl)
      xhr.setRequestHeader('Content-Type', file.type)
      xhr.setRequestHeader('x-upsert', 'false')
      xhr.send(file)
    })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error uploading file with progress:', error);
    }
    throw error
  }
}

// Note: No direct client export for security - use API endpoints instead