'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

export default function RestaurantFloorPlan() {
  const [floorPlan, setFloorPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const containerRef = useRef(null)
  const router = useRouter()

  useEffect(() => {
    const fetchFloorPlan = async () => {
      const token = localStorage.getItem("restaurantOwnerToken")
      const storedRestaurant = localStorage.getItem("selectedRestaurant")
      
      if (!token || !storedRestaurant) {
        alert("Unauthorized! Please log in.")
        router.push('/login')
        return
      }

      const restaurant = JSON.parse(storedRestaurant)

      try {
        // First get the restaurant data to access the floorplans array
        const response = await fetch("/api/restaurants", {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        
        if (response.ok) {
          const { restaurant } = await response.json()
          if (restaurant && restaurant.floorplans && restaurant.floorplans.length > 0) {
            // Get the latest floorplan
            const latestFloorplanId = restaurant.floorplans[restaurant.floorplans.length - 1]
            
            let floorplanId
            if (typeof latestFloorplanId === 'object' && latestFloorplanId._id) {
                // If it's already populated, use _id
                floorplanId = latestFloorplanId._id
            } else {
                // If it's just the ID string
                floorplanId = latestFloorplanId
            }
            
            // Fetch the specific floorplan
            const floorplanResponse = await fetch(`/api/scenes/${floorplanId}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            })

            if (floorplanResponse.ok) {
              const floorplanData = await floorplanResponse.json()
              setFloorPlan(floorplanData)
            } else {
              console.error("Failed to fetch floor plan details:", await floorplanResponse.text())
            }
          }
        } else {
          console.error("Failed to fetch restaurant data:", await response.text())
        }
      } catch (error) {
        console.error("Error fetching floor plan:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchFloorPlan()
  }, [router])

  useEffect(() => {
    if (!floorPlan || !containerRef.current) return

    // Initialize Three.js scene
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    containerRef.current.appendChild(renderer.domElement)

    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true

    // Set camera position
    camera.position.set(0, 5, 10)
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
    directionalLight.position.set(0, 10, 0)
    scene.add(directionalLight)

    // Load and add floor plan objects
    if (floorPlan.data && floorPlan.data.objects) {
      floorPlan.data.objects.forEach(obj => {
        // Create mesh based on object type
        let mesh
        
        if (obj.type === 'table') {
          const geometry = new THREE.BoxGeometry(obj.width || 1, obj.height || 0.5, obj.depth || 1)
          const material = new THREE.MeshPhongMaterial({ color: obj.color || 0x808080 })
          mesh = new THREE.Mesh(geometry, material)
        } else if (obj.type === 'chair') {
          const geometry = new THREE.CylinderGeometry(0.25, 0.25, 0.5, 32)
          const material = new THREE.MeshPhongMaterial({ color: obj.color || 0x404040 })
          mesh = new THREE.Mesh(geometry, material)
        }

        if (mesh) {
          mesh.position.set(obj.position.x, obj.position.y, obj.position.z)
          mesh.rotation.set(obj.rotation.x, obj.rotation.y, obj.rotation.z)
          scene.add(mesh)
        }
      })
    }

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // Handle window resize
    const handleResize = () => {
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    }
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      containerRef.current?.removeChild(renderer.domElement)
      renderer.dispose()
    }
  }, [floorPlan])

  if (loading) {
    return <div className="text-xl">Loading floor plan...</div>
  }

  if (!floorPlan) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">No Floor Plan Found</h2>
        <p className="text-gray-600 mb-6">Create a floor plan to manage your restaurant layout</p>
        <button
          onClick={() => router.push('/floorplan')}
          className="bg-gray-900 text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors"
        >
          Create Floor Plan
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl p-10 border border-gray-100">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Floor Plan</h1>
          <p className="text-gray-500 mt-2">3D Restaurant Layout</p>
        </div>
        <button
          onClick={() => router.push('/floorplan')}
          className="flex items-center gap-2 bg-gray-900 text-white py-2.5 px-5 rounded-xl font-semibold hover:bg-gray-800"
        >
          Edit Floor Plan
        </button>
      </div>

      {/* 3D Viewer Container */}
      <div 
        ref={containerRef} 
        className="aspect-video bg-gray-50 rounded-2xl overflow-hidden"
        style={{ minHeight: '500px' }}
      />
    </div>
  )
} 