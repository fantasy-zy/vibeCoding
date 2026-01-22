import './ControlPanel.css'

interface ControlPanelProps {
  backgroundColor: string
  onBackgroundColorChange: (color: string) => void
  autoRotate: boolean
  onAutoRotateChange: (value: boolean) => void
  wireframe: boolean
  onWireframeChange: (value: boolean) => void
  showGrid: boolean
  onShowGridChange: (value: boolean) => void
  modelInfo: { vertices: number; faces: number; materials: number } | null
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  backgroundColor,
  onBackgroundColorChange,
  autoRotate,
  onAutoRotateChange,
  wireframe,
  onWireframeChange,
  showGrid,
  onShowGridChange,
  modelInfo
}) => {
  return (
    <div className="control-panel">
      <h2 className="panel-title">视图控制</h2>
      
      <div className="control-group">
        <label className="control-label">
          <input
            type="checkbox"
            checked={autoRotate}
            onChange={(e) => onAutoRotateChange(e.target.checked)}
            className="control-checkbox"
          />
          <span>自动旋转</span>
        </label>
      </div>

      <div className="control-group">
        <label className="control-label">
          <input
            type="checkbox"
            checked={wireframe}
            onChange={(e) => onWireframeChange(e.target.checked)}
            className="control-checkbox"
          />
          <span>线框模式</span>
        </label>
      </div>

      <div className="control-group">
        <label className="control-label">
          <input
            type="checkbox"
            checked={showGrid}
            onChange={(e) => onShowGridChange(e.target.checked)}
            className="control-checkbox"
          />
          <span>显示网格</span>
        </label>
      </div>

      <div className="control-group">
        <label className="control-label">
          <span>背景颜色</span>
          <input
            type="color"
            value={backgroundColor}
            onChange={(e) => onBackgroundColorChange(e.target.value)}
            className="color-picker"
          />
        </label>
      </div>

      <div className="info-section">
        <h3 className="info-title">模型信息</h3>
        <div className="info-content">
          <div className="info-item">
            <span className="info-label">顶点数:</span>
            <span className="info-value">{modelInfo ? modelInfo.vertices.toLocaleString() : '--'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">面数:</span>
            <span className="info-value">{modelInfo ? modelInfo.faces.toLocaleString() : '--'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">材质数:</span>
            <span className="info-value">{modelInfo ? modelInfo.materials : '--'}</span>
          </div>
        </div>
      </div>

      <div className="shortcuts-section">
        <h3 className="shortcuts-title">快捷键</h3>
        <div className="shortcuts-list">
          <div className="shortcut-item">
            <kbd>R</kbd>
            <span>重置视角</span>
          </div>
          <div className="shortcut-item">
            <kbd>G</kbd>
            <span>切换网格</span>
          </div>
          <div className="shortcut-item">
            <kbd>W</kbd>
            <span>切换线框模式</span>
          </div>
          <div className="shortcut-item">
            <kbd>A</kbd>
            <span>切换自动旋转</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ControlPanel
