import 'leaflet/dist/leaflet.css'
import './App.css'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MapContainer, TileLayer, LayersControl, Circle, CircleMarker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'

const CENTER = [19.099639, 72.847222]

const CIRCLE_STYLE = {
  color: '#2d6a4f',
  fillColor: '#52b788',
  fillOpacity: 0.5,
  weight: 1.5,
}

const POINT_STYLE = {
  color: '#1b4332',
  fillColor: '#40916c',
  fillOpacity: 0.8,
  weight: 1.5,
}

function OpacitySlider({ opacity, onChange }) {
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current) L.DomEvent.disableClickPropagation(ref.current)
  }, [])

  return (
    <div ref={ref} className="opacity-control leaflet-bar">
      <span className="opacity-label">Opacity</span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={opacity}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="opacity-slider"
        orient="vertical"
      />
      <span className="opacity-value">{Math.round(opacity * 100)}%</span>
    </div>
  )
}

function val(v) {
  return v == null || v === 'null' ? '—' : v
}

function Lightbox({ src, alt, onClose }) {
  return createPortal(
    <div className="lightbox" onClick={onClose}>
      <img src={src} alt={alt} onClick={(e) => e.stopPropagation()} />
      <button className="lightbox-close" onClick={onClose}>✕</button>
    </div>,
    document.body
  )
}

function TreePopup({ p }) {
  const [lightbox, setLightbox] = useState(null)
  const imgSrc = p.photo ? `/tree_image/${p.photo}` : null

  return (
    <>
      <div className="tree-popup">
        <table>
          <tbody>
            <tr><th>No.</th><td>{val(p['Number'])}</td></tr>
            <tr><th>Common name</th><td>{val(p['common name'])}</td></tr>
            <tr><th>Scientific name</th><td>{val(p['scientific name'])}</td></tr>
            <tr><th>Girth (cm)</th><td>{val(p['girth'])}</td></tr>
            <tr><th>Height (m)</th><td>{val(p['height'])}</td></tr>
            <tr><th>Canopy dia (m)</th><td>{val(p['canopy dia'])}</td></tr>
            <tr><th>Edge condition</th><td>{val(p['edge condition'])}</td></tr>
          </tbody>
        </table>
        {imgSrc && (
          <img
            src={imgSrc}
            alt={val(p['common name'])}
            className="tree-photo"
            onClick={() => setLightbox(imgSrc)}
          />
        )}
      </div>
      {lightbox && (
        <Lightbox
          src={lightbox}
          alt={val(p['common name'])}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  )
}

export default function App() {
  const [features, setFeatures] = useState([])
  const [opacity, setOpacity] = useState(1)

  useEffect(() => {
    fetch('/survey.geojson')
      .then((r) => r.json())
      .then((data) => setFeatures(data.features))
  }, [])

  return (
    <MapContainer center={CENTER} zoom={19} maxZoom={22} style={{ height: '100vh', width: '100%' }}>
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="OpenStreetMap">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={25}
            maxNativeZoom={19}
            opacity={opacity}
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Satellite">
          <TileLayer
            attribution='Tiles &copy; Esri'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={25}
            maxNativeZoom={19}
            opacity={opacity}
          />
        </LayersControl.BaseLayer>
      </LayersControl>

      <OpacitySlider opacity={opacity} onChange={setOpacity} />

      {features.map((feature) => {
        const p = feature.properties
        const [lng, lat] = feature.geometry.coordinates
        const girth = parseFloat(p.girth)
        const hasGirth = !isNaN(girth) && p.girth !== 'null'

        return hasGirth ? (
          <Circle
            key={p._id}
            center={[lat, lng]}
            radius={girth / 200}
            pathOptions={CIRCLE_STYLE}
          >
            <Popup maxWidth={320}><TreePopup p={p} /></Popup>
          </Circle>
        ) : (
          <CircleMarker
            key={p._id}
            center={[lat, lng]}
            pathOptions={POINT_STYLE}
            radius={5}
          >
            <Popup maxWidth={320}><TreePopup p={p} /></Popup>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
