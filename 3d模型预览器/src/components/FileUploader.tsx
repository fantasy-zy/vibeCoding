import { useRef } from 'react'
import './FileUploader.css'

interface FileUploaderProps {
  onFileSelect: (file: File) => void
  onClear: () => void
  hasModel: boolean
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect, onClear, hasModel }) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const validExtensions = ['.glb', '.gltf', '.obj', '.fbx']
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
      
      if (validExtensions.includes(fileExtension)) {
        onFileSelect(file)
      } else {
        alert('不支持的文件格式。请使用 .glb, .gltf, .obj 或 .fbx 文件。')
      }
    }
    event.target.value = ''
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="file-uploader">
      <h2 className="uploader-title">上传模型</h2>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".glb,.gltf,.obj,.fbx"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      
      <button
        className="upload-button"
        onClick={handleUploadClick}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        选择文件
      </button>

      <div className="supported-formats">
        <p className="formats-title">支持的格式:</p>
        <div className="format-list">
          <span className="format-tag">.glb</span>
          <span className="format-tag">.gltf</span>
          <span className="format-tag">.obj</span>
          <span className="format-tag">.fbx</span>
        </div>
      </div>

      {hasModel && (
        <button
          className="clear-button"
          onClick={onClear}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          清除模型
        </button>
      )}

      <div className="tips">
        <p className="tips-title">使用提示:</p>
        <ul>
          <li>上传后可使用鼠标拖拽旋转模型</li>
          <li>滚轮可缩放视图</li>
          <li>右键拖拽可平移视角</li>
        </ul>
      </div>
    </div>
  )
}

export default FileUploader
