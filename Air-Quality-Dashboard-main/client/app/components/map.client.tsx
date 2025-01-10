// This component covers Functional Requirements 1, 3, 5, 6, 7, 27, 28, 29, 30
import { LayerGroup, LayersControl, MapContainer, Marker, Popup, ScaleControl, TileLayer, Tooltip } from 'react-leaflet'
import "leaflet/dist/leaflet.css";
import { LocationControl } from "./LocationControl";
import { LegendControl } from "./LegendControl";
import { SensorLegendControl } from "./SensorLegendControl";
import QueryControl from "./QueryControl";
import { MouseEventHandler, useMemo, useState } from "react";
import MapNavbar from "./mapNavbar";
import Plot from './Plot';

import { createStationSensorIcon, createPurpleAirSensorIcon } from './leaflet-utils';
import HighlightControl from './HighlightControl';
import { LeafletEventHandlerFn } from 'leaflet';
import { EventCallbackFunction } from '@azure/msal-browser';

const purpleair_data: {[key: string]: [any, L.Marker]} = {};
const station_data: {[key: string]: [any, L.Marker]} = {};

export const createPurpleAirMarker = (sensor: any, add_handler: LeafletEventHandlerFn, button_function: MouseEventHandler<HTMLButtonElement>) => {
  return (
    <Marker key={sensor.id} position={[sensor.latitude, sensor.longitude]} opacity={1} icon={createPurpleAirSensorIcon(sensor.aqhi_plus)}
    eventHandlers={{
      add: add_handler
    }
    }>
      {/* FR6 - Load.Sensor.Data - The system shall load the sensor data retrieved from the PurpleAir API based on the sensor. */}
      <Tooltip direction='right' offset={[20, 0]} position={[sensor.latitude, sensor.longitude]} opacity={0.9}>
        <div className='text-sm'>
            <h1 className='text-lg font-bold'>{sensor.name}</h1>
            <div className='flex flex-col items-start px-2'>
              <div><span className='font-bold'>Updated:</span> {(new Date(sensor._ts*1000)).toLocaleString(navigator.language, {year:'numeric' ,month: 'short', day: '2-digit', hour:'numeric'})}<br /></div>
              <div><span className='font-bold'>10 min.</span> Average <span className='font-bold'>{sensor["pm2.5_10minute"]}</span> μg m<sup>-3</sup></div>
              <div><span className='font-bold'>30 min.</span> Average <span className='font-bold'>{sensor["pm2.5_10minute"]}</span> μg m<sup>-3</sup></div>
              <div><span className='font-bold'>1 hr.</span> Average <span className='font-bold'>{sensor["pm2.5_60minute"]}</span> μg m<sup>-3</sup></div>
            </div>
        </div>
      </Tooltip>
      {/* FR7 - Display.Sensor.Data - The system shall display averaged sensor data as a pop-up in the time intervals of 10 minutes, 1-hour, 6-hour, and 24 hours when the user clicks on a sensor. */}
      <Popup autoClose={false} closeButton>
        <div>
          <h1 className='text-lg font-bold'>{sensor.name} <br/></h1>
          <div className='flex flex-col justify-evenly text-sm p-2 whitespace-nowrap' data-testid="marker-popup">
          <div><span className='font-bold'>Updated:</span> {(new Date(sensor._ts*1000)).toLocaleString(navigator.language, {year:'numeric' ,month: 'short', day: '2-digit', hour:'numeric'})}</div>
            <div><span className='font-bold'>Confidence</span>: {sensor["confidence"]}%</div>
            <div><span className='font-bold'>10 min.</span> Average <span className='font-bold'>{sensor["pm2.5_10minute"]}</span> μg m<sup>-3</sup></div>
            <div><span className='font-bold'>30 min.</span> Average <span className='font-bold'>{sensor["pm2.5_30minute"]}</span> μg m<sup>-3</sup></div>
            <div><span className='font-bold'>1 hr.</span> Average <span className='font-bold'>{sensor["pm2.5_60minute"]}</span> μg m<sup>-3</sup></div>
            <div><span className='font-bold'>6 hr.</span> Average <span className='font-bold'>{sensor["pm2.5_6hour"]}</span> μg m<sup>-3</sup></div>
            <div><span className='font-bold'>24 hr.</span> Average <span className='font-bold'>{sensor["pm2.5_24hour"]}</span> μg m<sup>-3</sup></div>
          </div>
          <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded-full" onClick={button_function}>
            Time Plot
          </button>
        </div>
      </Popup>
    </Marker>
    )
}

export const createStationMarker = (sensor: any, add_handler: LeafletEventHandlerFn) => {
  return (
    <Marker key={sensor.id} position={[sensor.latitude, sensor.longitude]} icon={createStationSensorIcon(Math.round(sensor.aqhi))}
    eventHandlers={{
      add: add_handler
    }}>
    <Tooltip direction='right' offset={[20, 0]} position={[sensor.latitude, sensor.longitude]} opacity={0.9}>
      <div className='text-sm p-2'>
          <h1 className='text-lg font-bold'>{sensor.location_name}</h1>
          <div className='flex flex-col items-start'>
            <div><span className='font-bold'>Updated</span>: {new Date(sensor.observation_datetime).toLocaleString(navigator.language, {year:'numeric' ,month: 'short', day: '2-digit', hour:'numeric'})}</div>
          </div>
      </div>
      </Tooltip>
      <Popup autoClose={false} closeButton>
        <div>
          <h1 className='text-lg font-bold w-full'>{sensor.location_name}<br/></h1>
          <div className='flex flex-col flex-nowrap whitespace-nowrap text-sm'>
            <h2 className='text-sm w-full flex-1 py-2'><span className='font-bold'>Updated</span>: {(new Date(sensor.observation_datetime)).toLocaleString(navigator.language, {year:'numeric' ,month: 'short', day: '2-digit', hour:'numeric'})}<br/></h2>
            <h2 className='text-sm w-full flex-1'><span className='font-bold'>AQHI</span>: {Math.round(sensor.aqhi)}<br/></h2>
          </div>
        </div>
      </Popup>
  </Marker>
  )
}

// TODO: update any to JsonifyObject
export default function Map({ sensors, latitude, longitude }: any) {

  const [map, setMap] = useState(null);

  const purpleair = sensors.purpleair
  const station = sensors.station

  const [plotDetails, setPlotDetails] = useState<any | null>({ show: false, sensorId: null });

  const showPlot = (sensorId: number) => {
    setPlotDetails({ show: true, sensorId });
  };

  const hidePlot = () => {
    setPlotDetails({ ...plotDetails, show: false });
  };
  
  /* FR1 - Map.View - The system should display a world map marking the locations of all PurpleAir sensors in the Edmonton Area using Leaflet and OpenStreetMap. */
  const displayMap = useMemo(
    () => (
      <div data-testid="map" style={{height: "100%"}}>
      {/* FR3 - Map.Interact - The system should allow a user to pan the map in any direction as well as zooming in and out. */}
      {/* @ts-ignore */}
      <MapContainer ref={setMap} center={[latitude, longitude]} zoom={11} scrollWheelZoom={true} className='z-40 min-h-full text-center' tap={false} doubleClickZoom>
        
        <ScaleControl position='bottomleft'/>
        <LocationControl position='topleft' />
        <LegendControl position='bottomright' />
        <HighlightControl props={{position:'topleft'}} data={purpleair_data} />
        <QueryControl props={{position:'topleft'}} data={purpleair_data}/>
        

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* FR29 - Enable.Sensors - The system shall display a category of sensors when the user enables them. */}
        {/* FR30 - Disable.Sensors - The system shall remove a category of sensors when the user disables them. */}
        <LayersControl position='topright' collapsed={false}>
          <LayersControl.Overlay name='<span class="text-sm">Purple-Air Sensors</span>' checked>
            <LayerGroup >
              {purpleair && purpleair.map((sensor: any) => {
                  {/* FR5 - Display.Sensors - The system should display a marker with its real time BC AQHI+ value and be colored depending on the risk. 
                      The color scaling follows the National AQHI color scale along with its corresponding PM2.5 concentration in ug/cm3. */}
                  {/* FR27 - Indexes.Display - The system shall display the BC AQHI+ index for PurpleAir sensors and National AQHI for Agency Monitors. */}
                  return (
                    createPurpleAirMarker(sensor,
                    // add handler
                    (event) => {
                      purpleair_data[sensor.id] = [sensor, event.target]
                    },
                    // button click function
                    () => showPlot(sensor.id))
                  )
                }
              )}
            </LayerGroup>
          </LayersControl.Overlay>
          <LayersControl.Overlay name='<span class="text-sm">Agency Monitors</span>' checked>
            <LayerGroup>
              {/* FR27 - Indexes.Display - The system shall display the BC AQHI+ index for PurpleAir sensors and National AQHI for Agency Monitors. */}
              {/* FR28 - Agency.Sensors - The system shall display Agency Monitors via Environment and Climate Change Canada api data source along with their National AQHI. */}
              {station.map((sensor: any) => {
                return(
                  createStationMarker(
                  sensor,
                  // add handler
                  (event) => {
                    station_data[sensor.id] = [sensor, event.target]
                  })
                )
              })
              }
            </LayerGroup>
          </LayersControl.Overlay>
        </LayersControl>
        <SensorLegendControl position='topright' />
      </MapContainer>
    </div>
    ),
    [purpleair_data, station_data],
  );

  return (
    <div className="flex flex-col h-screen">
      {map ? <MapNavbar map={map} purpleair_data={purpleair_data} station_data={station_data} />: null}
      <Plot show={plotDetails.show} sensorId={plotDetails.sensorId} onClose={hidePlot}/>
      <div style={{height: "100%"}}>
        {displayMap}
      </div>
    </div>
  )
}
