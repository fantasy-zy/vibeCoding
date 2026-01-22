import { useState, useCallback } from 'react'
import { flushSync } from 'react-dom'
import Scene3D from './components/Scene3D'
import FileUploader from './components/FileUploader'
import ControlPanel from './components/ControlPanel'
import LoadingOverlay from './components/LoadingOverlay'
import './App.css'

function App() {
  const [modelUrl, setModelUrl] = useState<string | null>(null)
  const [modelExtension, setModelExtension] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [backgroundColor, setBackgroundColor] = useState('#0a0a0f')
  const [autoRotate, setAutoRotate] = useState(false)
  const [wireframe, setWireframe] = useState(false)
  const [showGrid, setShowGrid] = useState(true)
  const [modelInfo, setModelInfo] = useState<{ vertices: number; faces: number; materials: number } | null>(null)

  const handleFileSelect = useCallback((file: File) => {
    const url = URL.createObjectURL(file)
    const extension = file.name.split('.').pop()?.toLowerCase() || ''
    setModelUrl(url)
    setModelExtension(extension)
    setError(null)
    setModelInfo(null)
  }, [])

  const handleLoadingProgress = useCallback((progress: number) => {
    flushSync(() => {
      setLoadingProgress(progress)
    })
  }, [])

  const handleLoadingStart = useCallback(() => {
    setLoading(true)
    setLoadingProgress(0)
  }, [])

  const handleLoadingComplete = useCallback(() => {
    setLoading(false)
    setLoadingProgress(0)
  }, [])

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage)
    setLoading(false)
  }, [])

  const handleClearModel = useCallback(() => {
    setModelUrl(null)
    setModelExtension(null)
    setError(null)
    setModelInfo(null)
    setLoading(false)
    setLoadingProgress(0)
  }, [])

  const handleToggleGrid = useCallback(() => {
    setShowGrid(prev => !prev)
  }, [])

  const handleToggleWireframe = useCallback(() => {
    setWireframe(prev => !prev)
  }, [])

  const handleToggleAutoRotate = useCallback(() => {
    setAutoRotate(prev => !prev)
  }, [])

  return (
    <div className="app">
      <LoadingOverlay
        loading={loading}
        progress={loadingProgress}
      />
      
      <header className="app-header">
        <h1>3D模型预览器</h1>
      </header>

      <main className="app-main">
        <div className="viewer-container">
          <Scene3D
            modelUrl={modelUrl}
            modelExtension={modelExtension}
            onLoadingStart={handleLoadingStart}
            onLoadingProgress={handleLoadingProgress}
            onLoadingComplete={handleLoadingComplete}
            onError={handleError}
            backgroundColor={backgroundColor}
            autoRotate={autoRotate}
            wireframe={wireframe}
            showGrid={showGrid}
            onModelInfoChange={setModelInfo}
            onToggleGrid={handleToggleGrid}
            onToggleWireframe={handleToggleWireframe}
            onToggleAutoRotate={handleToggleAutoRotate}
          />
        </div>

        <aside className="sidebar">
          <FileUploader
            onFileSelect={handleFileSelect}
            onClear={handleClearModel}
            hasModel={!!modelUrl}
          />
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {modelUrl && (
            <ControlPanel
              backgroundColor={backgroundColor}
              onBackgroundColorChange={setBackgroundColor}
              autoRotate={autoRotate}
              onAutoRotateChange={setAutoRotate}
              wireframe={wireframe}
              onWireframeChange={setWireframe}
              showGrid={showGrid}
              onShowGridChange={setShowGrid}
              modelInfo={modelInfo}
            />
          )}
        </aside>
      </main>
    </div>
  )
}

export default App
