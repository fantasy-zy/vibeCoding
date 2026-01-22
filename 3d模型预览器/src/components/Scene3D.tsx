import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import './Scene3D.css'

interface Scene3DProps {
  modelUrl: string | null
  modelExtension: string | null
  onLoadingStart: () => void
  onLoadingProgress: (progress: number) => void
  onLoadingComplete: () => void
  onError: (error: string) => void
  backgroundColor: string
  autoRotate: boolean
  wireframe: boolean
  showGrid: boolean
  onModelInfoChange?: (info: { vertices: number; faces: number; materials: number }) => void
  onToggleGrid?: () => void
  onToggleWireframe?: () => void
  onToggleAutoRotate?: () => void
}

const Scene3D: React.FC<Scene3DProps> = ({
  modelUrl,
  modelExtension,
  onLoadingStart,
  onLoadingProgress,
  onLoadingComplete,
  onError,
  backgroundColor,
  autoRotate,
  wireframe,
  showGrid,
  onModelInfoChange,
  onToggleGrid,
  onToggleWireframe,
  onToggleAutoRotate
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const gridHelperRef = useRef<THREE.GridHelper | null>(null)
  const currentModelRef = useRef<THREE.Group | null>(null)
  const animationIdRef = useRef<number | null>(null)
  const resetViewRef = useRef<(() => void) | null>(null)
  const prevModelUrlRef = useRef<string | null>(null)

  useEffect(() => {
    if (prevModelUrlRef.current !== null && modelUrl === null && sceneRef.current && currentModelRef.current) {
      const model = currentModelRef.current
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) {
            child.geometry.dispose()
          }
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(material => material.dispose())
            } else {
              child.material.dispose()
            }
          }
        }
      })
      sceneRef.current.remove(model)
      currentModelRef.current = null
      resetViewRef.current = null
      if (controlsRef.current) {
        controlsRef.current.enableRotate = false
        controlsRef.current.enableZoom = false
        controlsRef.current.enablePan = false
      }
    }
    prevModelUrlRef.current = modelUrl
  }, [modelUrl])

  useEffect(() => {
    if (!containerRef.current) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0a0f)

    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222)
    scene.add(gridHelper)
    gridHelperRef.current = gridHelper

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5)
    directionalLight.position.set(5, 10, 7.5)
    directionalLight.castShadow = true
    scene.add(directionalLight)

    const backLight = new THREE.DirectionalLight(0xffffff, 0.8)
    backLight.position.set(-5, 5, -7.5)
    scene.add(backLight)

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5)
    fillLight.position.set(-5, 0, 5)
    scene.add(fillLight)

    const camera = new THREE.PerspectiveCamera(
      45,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.001,
      10000
    )
    camera.position.set(5, 5, 5)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    containerRef.current.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    // controls.enableDamping = true
    // controls.dampingFactor = 0.01
    controls.minDistance = 0.01
    controls.maxDistance = 1000
    controls.enableRotate = false
    controls.enableZoom = false
    controls.enablePan = false
    controls.rotateSpeed = 1.0
    controls.zoomSpeed = 1.0
    controls.panSpeed = 1.0
    controls.autoRotateSpeed = 10.0

    sceneRef.current = scene
    cameraRef.current = camera
    rendererRef.current = renderer
    controlsRef.current = controls

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate)
      if (controlsRef.current) {
        controlsRef.current.update()
      }
      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    }

    window.addEventListener('resize', handleResize)

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!prevModelUrlRef.current) return
      
      switch (event.key.toLowerCase()) {
        case 'r':
          if (resetViewRef.current) {
            resetViewRef.current()
          }
          break
        case 'g':
          if (onToggleGrid) {
            onToggleGrid()
          }
          break
        case 'w':
          if (onToggleWireframe) {
            onToggleWireframe()
          }
          break
        case 'a':
          if (onToggleAutoRotate) {
            onToggleAutoRotate()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('keydown', handleKeyDown)
      
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
      
      if (controlsRef.current) {
        controlsRef.current.dispose()
        controlsRef.current = null
      }
      
      if (rendererRef.current) {
        if (rendererRef.current.domElement && containerRef.current) {
          containerRef.current.removeChild(rendererRef.current.domElement)
        }
        rendererRef.current.dispose()
        rendererRef.current = null
      }
      
      if (currentModelRef.current) {
        currentModelRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            if (child.geometry) {
              child.geometry.dispose()
            }
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(material => material.dispose())
              } else {
                child.material.dispose()
              }
            }
          }
        })
        currentModelRef.current = null
      }
      
      sceneRef.current = null
      cameraRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!modelUrl || !sceneRef.current || !modelExtension) {
      return
    }

    if (currentModelRef.current) {
      sceneRef.current.remove(currentModelRef.current)
      currentModelRef.current = null
    }

    onLoadingStart()

    const loadModel = () => {
      switch (modelExtension) {
        case 'glb':
        case 'gltf':
          loadGLTF()
          break
        case 'obj':
          loadOBJ()
          break
        case 'fbx':
          loadFBX()
          break
        default:
          onError('不支持的文件格式。请使用 .glb, .gltf, .obj 或 .fbx 文件。')
          onLoadingComplete()
      }
    }

    const loadGLTF = () => {
      const loader = new GLTFLoader()
      
      const dracoLoader = new DRACOLoader()
      dracoLoader.setDecoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/')
      loader.setDRACOLoader(dracoLoader)
      
      loader.load(
        modelUrl,
        (gltf) => {
          const model = gltf.scene
          addModelToScene(model)
        },
        (progress) => {
          if (progress.total > 0) {
            const percent = (progress.loaded / progress.total) * 100
            onLoadingProgress(percent)
          }
        },
        (_error) => {
          onError('模型加载失败，请检查文件是否有效。')
          onLoadingComplete()
        }
      )
    }

    const loadOBJ = () => {
      const loader = new OBJLoader()
      loader.load(
        modelUrl,
        (obj) => {
          addModelToScene(obj)
        },
        (progress) => {
          if (progress.total > 0) {
            const percent = (progress.loaded / progress.total) * 100
            onLoadingProgress(percent)
          }
        },
        (_error) => {
          onError('模型加载失败，请检查文件是否有效。')
          onLoadingComplete()
        }
      )
    }

    const loadFBX = () => {
      const loader = new FBXLoader()
      loader.load(
        modelUrl,
        (fbx) => {
          addModelToScene(fbx)
        },
        (progress) => {
          if (progress.total > 0) {
            const percent = (progress.loaded / progress.total) * 100
            onLoadingProgress(percent)
          }
        },
        (_error) => {
          onError('模型加载失败，请检查文件是否有效。')
          onLoadingComplete()
        }
      )
    }

    const addModelToScene = (model: THREE.Group) => {
      if (!sceneRef.current || !cameraRef.current) {
        onError('场景初始化失败')
        onLoadingComplete()
        return
      }

      const box = new THREE.Box3().setFromObject(model)
      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())

      model.position.sub(center)

      const maxDim = Math.max(size.x, size.y, size.z)
      let distanceMultiplier
      if (maxDim < 1) {
        distanceMultiplier = 1.5
      } else if (maxDim < 5) {
        distanceMultiplier = 2
      } else {
        distanceMultiplier = 2.5
      }
      const cameraDistance = maxDim * distanceMultiplier

      cameraRef.current.position.set(cameraDistance, cameraDistance * 0.5, cameraDistance)
      cameraRef.current.lookAt(0, 0, 0)

      if (controlsRef.current) {
        controlsRef.current.target.set(0, 0, 0)
        controlsRef.current.update()
        controlsRef.current.enableRotate = true
        controlsRef.current.enableZoom = true
        controlsRef.current.enablePan = true
        
        const minZoomDistance = maxDim * 0.1
        const maxZoomDistance = maxDim * 20
        controlsRef.current.minDistance = Math.max(0.001, minZoomDistance)
        controlsRef.current.maxDistance = maxZoomDistance
      }

      sceneRef.current.add(model)
      currentModelRef.current = model
      
      resetViewRef.current = () => {
        if (cameraRef.current && controlsRef.current) {
          const box = new THREE.Box3().setFromObject(model)
          const size = box.getSize(new THREE.Vector3())
          const maxDim = Math.max(size.x, size.y, size.z)
          let distanceMultiplier
          if (maxDim < 1) {
            distanceMultiplier = 1.5
          } else if (maxDim < 5) {
            distanceMultiplier = 2
          } else {
            distanceMultiplier = 2.5
          }
          const cameraDistance = maxDim * distanceMultiplier

          cameraRef.current.position.set(cameraDistance, cameraDistance * 0.5, cameraDistance)
          cameraRef.current.lookAt(0, 0, 0)
          controlsRef.current.target.set(0, 0, 0)
          controlsRef.current.update()
          
          const minZoomDistance = maxDim * 0.1
          const maxZoomDistance = maxDim * 20
          controlsRef.current.minDistance = Math.max(0.001, minZoomDistance)
          controlsRef.current.maxDistance = maxZoomDistance
        }
      }
      
      let vertexCount = 0
      let faceCount = 0
      const materialSet = new Set<THREE.Material>()
      
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (!child.material) {
            child.material = new THREE.MeshStandardMaterial({ color: 0x808080 })
          }
          
          const geometry = child.geometry
          if (geometry) {
            vertexCount += geometry.attributes.position.count
            if (geometry.index) {
              faceCount += geometry.index.count / 3
            } else {
              faceCount += geometry.attributes.position.count / 3
            }
          }
          
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => materialSet.add(mat))
            } else {
              materialSet.add(child.material)
            }
          }
        }
      })
      
      if (onModelInfoChange) {
        onModelInfoChange({
          vertices: vertexCount,
          faces: Math.floor(faceCount),
          materials: materialSet.size
        })
      }
      
      onLoadingComplete()
    }

    loadModel()
  }, [modelUrl, modelExtension, onLoadingStart, onLoadingProgress, onLoadingComplete, onError])

  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.background = new THREE.Color(backgroundColor)
    }
  }, [backgroundColor])

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate
    }
  }, [autoRotate])

  useEffect(() => {
    if (currentModelRef.current) {
      currentModelRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(material => {
              (material as any).wireframe = wireframe
            })
          } else {
            (child.material as any).wireframe = wireframe
          }
        }
      })
    }
  }, [wireframe])

  useEffect(() => {
    if (gridHelperRef.current) {
      gridHelperRef.current.visible = showGrid
    }
  }, [showGrid])

  return (
    <div ref={containerRef} className="scene3d-container">
      {!modelUrl && (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
          <p>请上传3D模型文件开始预览</p>
          <p className="hint">支持格式: .glb, .gltf, .obj, .fbx</p>
        </div>
      )}
    </div>
  )
}

export default Scene3D
