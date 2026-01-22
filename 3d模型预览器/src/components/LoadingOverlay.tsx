import './LoadingOverlay.css'

interface LoadingOverlayProps {
  loading: boolean
  progress: number
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ loading, progress }) => {
  if (!loading) return null

  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <div className="loading-spinner">
          <svg viewBox="0 0 50 50">
            <circle
              className="spinner-circle"
              cx="25"
              cy="25"
              r="20"
              fill="none"
              strokeWidth="4"
            />
          </svg>
        </div>
        <p className="loading-text">加载模型中...</p>
        <div className="progress-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="progress-text">{Math.round(progress)}%</span>
        </div>
      </div>
    </div>
  )
}

export default LoadingOverlay
