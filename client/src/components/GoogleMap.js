import React from 'react'
import { Loader } from '@googlemaps/js-api-loader'
import googleMapsTheme from '../data/mapsTheme.json'
import '../styles/GoogleMap.scss'
import { useMobx } from '../store/mobx'
import { observer } from 'mobx-react-lite'
import { useWindowSize } from 'react-use'

const GoogleMap = ({
  center,
  zoom = 6,
  className,
  marker = null,
  useArrowIcon = false,
  panLeft = false,
  ...props
}) => {
  const {
    config: { googleMapsApiKey },
  } = useMobx()
  const [loader] = React.useState(
    new Loader({
      apiKey: googleMapsApiKey,
      version: 'weekly',
    })
  )
  const domRef = React.useRef()
  const [mapInstance, setMapInstance] = React.useState()
  const [activeMarker, setActiveMarker] = React.useState(null)
  const [hasError, setHasError] = React.useState(false)
  const [activeZoom, setActiveZoom] = React.useState(zoom)
  const [tilesLoaded, setTilesLoaded] = React.useState(false)
  const { width: windowWidth } = useWindowSize()

  React.useEffect(() => {
    if (!activeMarker || !useArrowIcon) return

    activeMarker.setIcon({
      ...activeMarker.icon,
      scale: mapInstance.getZoom() / 4,
    })
  }, [activeZoom, mapInstance, activeMarker, useArrowIcon])

  React.useEffect(() => {
    if (!tilesLoaded || !panLeft) return
    mapInstance.setCenter(center)
    mapInstance.panBy(windowWidth / 4, 0)
  }, [mapInstance, windowWidth, panLeft, center, tilesLoaded])

  React.useEffect(() => {
    loader.load().then(() => {
      if (!mapInstance) {
        if (!domRef.current) return

        // eslint-disable-next-line
        const newInstance = new google.maps.Map(domRef.current, {
          zoom,
          center,
          disableDefaultUI: true,
          styles: googleMapsTheme,
        })
        setMapInstance(newInstance)

        if (panLeft && domRef.current) {
          newInstance.panBy(-(domRef.current.offsetWidth / 6), 0)
        }

        newInstance.addListener('tilesloaded', () => {
          setTilesLoaded(true)
          if (domRef.current.children.length > 1) {
            setHasError(true)
          }
        })

        newInstance.addListener('zoom_changed', () => {
          setActiveZoom(newInstance.getZoom())
        })

        return
      }

      const { icon, ...markerData } = marker

      if (icon) {
        markerData.icon = {
          ...marker.icon,
          ...(useArrowIcon
            ? {
                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, //eslint-disable-line
                anchor: new google.maps.Point(0.2, 2.4), //eslint-disable-line
                fillColor: 'white',
                fillOpacity: 1,
                strokeWeight: 0,
                scale: 5,
              }
            : {}),
        }
      }

      setActiveMarker(
        // eslint-disable-next-line
        new google.maps.Marker({
          ...markerData,
          map: mapInstance,
        })
      )
    })
  }, [center, zoom, marker, mapInstance]) // eslint-disable-line

  return (
    <div ref={domRef} className={`GoogleMap ${className || ''}`} {...props}>
      {hasError && (
        <div className="GoogleMapError">
          Failed to load Google map
          <br />
          Check your API key
        </div>
      )}
    </div>
  )
}

export default observer(GoogleMap)
