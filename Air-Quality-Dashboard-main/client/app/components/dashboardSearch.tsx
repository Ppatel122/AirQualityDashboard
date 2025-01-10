import { useRouteLoaderData } from "@remix-run/react";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { loader } from "~/root";
import { getSensorsWithDistance } from "./utils";

export function DashboardSearch({sensors} : any) {
  const data = useRouteLoaderData<typeof loader>("root")!;
  const env = data?.env;
  
  const [addressSearchResults, setAddressSearchResults] = useState([]);
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const addressSearchRef = useRef<HTMLElement | null>(null);

  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement

    if (addressSearchRef.current && !addressSearchRef.current.contains(event.target as Node)) {
      if (target.classList.contains('result'))
        return
      setAddressSearchResults([])
    }

  }
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [addressSearchRef])

  async function addressSearch(event: ChangeEvent<HTMLElement>) {
    event.preventDefault()
    const target = event.target as HTMLInputElement;
    setAddress(target.value);

    if (!address) return;

    const query_bytes = encodeURIComponent(address);
    try {
      const url = `https://atlas.microsoft.com/search/address/json?subscription-key=${env.Maps_key}&api-version=1.0&idxSet=PAD,Addr&typeahead=true&countrySet=CA&query=${query_bytes}`;
      const response = await fetch(url);
      const locations = await response.json();

      const res: any = [];
      locations.results.forEach((result: any) => {
        res.push(result);
      });

      setAddressSearchResults(res);
    } catch (error) {
      console.log(error);
    }
  }

  // Gets the current lat and lon and stores it in the global variables
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLat(latitude);
          setLon(longitude);
          setAddress("Current Location");
        },
        (error) => {
          console.error("Error getting user location:", error);
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  };

  const display = useMemo(() => {

    if (!lat && !lon)
      return null

    const purpleair = sensors.purpleair;
    const stations = sensors.station;

    const station_distances = getSensorsWithDistance(lat! , lon!, stations);
    const sensor_distances = getSensorsWithDistance(lat! , lon!, purpleair);

    const nearest_stations = station_distances.slice(0,3);
    const nearest_sensors = sensor_distances.slice(0, 3);

    let worst_value = 0;

    nearest_stations.forEach((station) => {
      if (station.aqhi && station.aqhi > worst_value) {
        worst_value = station.aqhi;
      }
    });
  
    nearest_sensors.forEach((sensor) => {
      if (sensor.aqhi_plus && sensor.aqhi_plus > worst_value) {
        worst_value = sensor.aqhi_plus;
      }
    });
  
    worst_value = Math.round(worst_value);

    return (
      <div className="w-full mt-4 overflow-hidden"> 
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="flex-1 bg-white rounded-lg shadow m-1 p-4 overflow-x-auto">
            <h4 className="block text-med font-medium text-gray-700 text-center">Closest Continuous Air Quality Monitoring Stations</h4>
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-center border-b border-gray-300">Station</th>
                  <th className="px-4 py-2 text-center border-b border-gray-300">National AQHI</th>
                  <th className="px-4 py-2 text-center border-b border-gray-300">Distance (km)</th>
                </tr>
              </thead>
              <tbody>
                {nearest_stations.map((station, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 text-center">{station.location_name}</td>
                    <td className="px-4 py-2 text-center">{Math.round(station.aqhi)}</td>
                    <td className="px-4 py-2 text-center">{station.distance.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="flex-1 bg-white rounded-lg shadow-md m-1 p-4 overflow-x-auto">
            <h4 className="block text-med font-medium text-gray-700 text-center">Closest Microsensors</h4>
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-center border-b border-gray-300">Sensor ID</th>
                  <th className="px-4 py-2 text-center border-b border-gray-300">AQHI+</th>
                  <th className="px-4 py-2 text-center border-b border-gray-300">Distance (km)</th>
                </tr>
              </thead>
              <tbody>
                {nearest_sensors.map((sensor, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 text-center">{sensor.name}</td>
                    <td className="px-4 py-2 text-center">{sensor.aqhi_plus}</td>
                    <td className="px-4 py-2 text-center">{sensor.distance.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex justify-center mt-4">
        <p className="bg-yellow-200 text-center rounded border p-2">
          <strong style={{ fontSize: '27px' }}>
              Follow <a href="https://www.canada.ca/en/environment-climate-change/services/air-quality-health-index/understanding-messages.html" className="text-blue-500 underline">recommendations</a> for an AQHI of {worst_value}
          </strong>
        </p>
      </div>
    </div>
    )
  }, [lat, lon])

  return (
    <div className="bg-white rounded-lg shadow-md p-4 w-full max-w-4xl mb-4">
      <h3 className="text-xl font-semibold mb-4 border-b-2 border-gray-300 pb-2 text-center">Address Search</h3>
      <div className="flex flex-col items-center text-sm font-medium text-gray-700">
        <div className="relative w-full mb-4 max-w-md mx-auto"> 
          <div className="flex">
            { /* @ts-ignore */}
            <input ref={addressSearchRef}
              id="address"
              type="search"
              className="p-2 flex-grow border border-gray-300 rounded-l-md" 
              placeholder="Enter Address"
              onChange={addressSearch}
              value={address}
              autoComplete="off"
            />
            <button
              type="button"
              onClick={getCurrentLocation}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-r-md"
            >
              Use Current Location
            </button>
          </div>
          {addressSearchResults.length > 0 && (
            <div className="absolute z-50 mt-1 rounded-md bg-white w-full max-w-md overflow-auto shadow-lg">
              {addressSearchResults.map((result: any, index) => (
                <button
                  key={index}
                  className="w-full text-left p-2 text-sm hover:bg-gray-100 result"
                  onClick={() => {
                    setAddress(result.address.freeformAddress);
                    setLat(result.position.lat);
                    setLon(result.position.lon);
                    setAddressSearchResults([]);
                  }}
                >
                  {result.address.freeformAddress}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {display}
      <img src="/img/AQHI.png" alt="AQHI Scale" className=""/>
      <p className="text-center">This image was retrieved from <a href = "https://prampairshed.ca/aqhi/" className="text-blue-500 underline">https://prampairshed.ca/aqhi/</a></p>
    </div>
  );
}