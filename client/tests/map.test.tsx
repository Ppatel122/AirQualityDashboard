/**
 * @jest-environment jsdom
 */

import Map from "../app/components/map.client";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createRemixStub } from "@remix-run/testing";
import { enableFetchMocks } from 'jest-fetch-mock';
import L from "leaflet"
import { createPurpleAirSensorIcon, createStationSensorIcon, getColor } from "../app/components/leaflet-utils";
import { createPurpleAirMarker, createStationMarker } from "../app/components/map.client";
import { getDistance } from "geolib";
import { getSensorsWithDistance } from "../app/components/utils";

require('dotenv').config()

enableFetchMocks();

const mock_response = require('./mock_response.json')

beforeEach(() => {
  jest.restoreAllMocks();
  // fetch.resetMocks()
});

afterEach(() => {
  jest.clearAllMocks();
});

beforeEach(async () => {
  const component = (props: any) => <Map {...props} sensors={mock_response} latitude={53.5461} longitude={-113.4937} />
  const RemixStub = await act(() => createRemixStub([
    {
      path: "/",
      Component: component,
    }
  ]))
  
  await act(() => render(<RemixStub />)); 

  // wait for map to render
  await waitFor(() => screen.findByTestId("map"));
})



// beforeEach(async () => {

//   /*
//   FR4 - Fetch.Sensor.Data - The system should use Purple Air API to retrieve the
//   real-time data for the sensors.
//   */

//   fetch.mockResponseOnce(JSON.stringify(
//     {
//     "resources": [
//       {
//         "latitude": 53.517874,
//         "longitude": -113.5161971,
//         "name": "Home",
//         "username": "villarre@ualberta.ca",
//         "threshold": 4,
//         "isabove": false,
//         "id": "ce954164-f3b2-41ba-85f0-8db19de41f3d",
//         "_rid": "4Y1KAN5k69BIAAAAAAAAAA==",
//         "_self": "dbs/4Y1KAA==/colls/4Y1KAN5k69A=/docs/4Y1KAN5k69BIAAAAAAAAAA==/",
//         "_etag": "\"39004a05-0000-0800-0000-66148d310000\"",
//         "_attachments": "attachments/",
//         "_ts": 1712622897
//       },
//       {
//         "latitude": 53.51779,
//         "longitude": -113.51675,
//         "name": "Daycare",
//         "username": "villarre@ualberta.ca",
//         "threshold": 2,
//         "isabove": true,
//         "id": "122213f6-d622-48b5-898f-1146fffa96fe",
//         "_rid": "4Y1KAN5k69BaAAAAAAAAAA==",
//         "_self": "dbs/4Y1KAA==/colls/4Y1KAN5k69A=/docs/4Y1KAN5k69BaAAAAAAAAAA==/",
//         "_etag": "\"4000dd79-0000-0800-0000-6614fc320000\"",
//         "_attachments": "attachments/",
//         "_ts": 1712651314
//       },
//       {
//         "latitude": 53.51779,
//         "longitude": -113.51675,
//         "name": "Apartment",
//         "username": "villarre@ualberta.ca",
//         "threshold": 1,
//         "isabove": true,
//         "id": "428fc953-a0ef-4619-bff3-39f82ecfd43c",
//         "_rid": "4Y1KAN5k69BbAAAAAAAAAA==",
//         "_self": "dbs/4Y1KAA==/colls/4Y1KAN5k69A=/docs/4Y1KAN5k69BbAAAAAAAAAA==/",
//         "_etag": "\"40007179-0000-0800-0000-6614fc2c0000\"",
//         "_attachments": "attachments/",
//         "_ts": 1712651308
//       },
//       {
//         "latitude": 53.56736,
//         "longitude": -113.4718,
//         "name": "UofA",
//         "username": "villarre@ualberta.ca",
//         "threshold": 4,
//         "isabove": false,
//         "id": "38d233c0-87b6-4dbe-a61b-4d30c99785a6",
//         "_rid": "4Y1KAN5k69BfAAAAAAAAAA==",
//         "_self": "dbs/4Y1KAA==/colls/4Y1KAN5k69A=/docs/4Y1KAN5k69BfAAAAAAAAAA==/",
//         "_etag": "\"40001aab-0000-0800-0000-6614ff2a0000\"",
//         "_attachments": "attachments/",
//         "_ts": 1712652074
//       }
//     ],
//   }
//   ));

// mock data retrival
//   const RemixStub = await act(() => createRemixStub([
//     {
//       path: "/",
//       Component: Index,
//       loader() {
//         return mock_response
//       }
//     }
//   ]))
  

//   await act(() => render(<RemixStub />));

//   // switch to map view
//   const view_button = await screen.findByTestId("toggle-view-button")
//   await act(() => fireEvent.click(view_button))
  
//   // wait for map to render
//   await waitFor(() => screen.findByTestId("map"));

// });

// /*
//  FR1 - Map.View - The system should display a world map marking the locations of all
//   PurpleAir sensors using Leaflet and OpenStreetMap.
// */
describe("FR1 - Map.View", () => {

  test("FR1 - map displays all PurpleAir sensors and stations", async () => {

    // retrive all purpleair markers from the map
    const purpleair_markers_count = (await screen.findAllByTestId("purpleair-marker")).length
    const purpleair_count = Object.values(mock_response.purpleair).length

    // expect all purpleair markers to be displayed on the map
    expect(purpleair_markers_count).toBe(purpleair_count);

    // retrive all station markers from the map
    const station_markers_count = (await screen.findAllByTestId("station-marker")).length
    const station_count = Object.values(mock_response.station).length
    
    // expect all station markers to be displayed on the map
    expect(station_markers_count).toBe(station_count);

    // check that the markers are rendered in the correct positon
    const purpleair = mock_response.purpleair;
    const stations = mock_response.station;

    for (const sensor of purpleair) {
      const marker = createPurpleAirMarker(sensor, () => {}, () => {})
      expect(marker.props.position).toStrictEqual([sensor.latitude, sensor.longitude])
    }

    for (const station of stations) {
      const marker = createStationMarker(station, () => {})
      expect(marker.props.position).toStrictEqual([station.latitude, station.longitude])
    }

  });
});

/*
FR2 - Request.Location - The user shall have an option to be redirected to their location
on the map view. On request the system should ask the user for permission to access their
general location. If the user accepts the permission, the system should redirect the user to
their location on the map view.
*/
describe("FR2 - Request.Location", () => {

  test('FR2 - request location and set map view', async () => {

    const mockGeolocation = {
      getCurrentPosition: jest.fn()
        .mockImplementationOnce((success) =>
          Promise.resolve(success({
            coords: {
              latitude: 53.517973081770315,
              longitude: -113.51254457938089
            }
          }
        ))),
    };

    (global as any).navigator.geolocation = mockGeolocation;

    const map_spy = jest.spyOn(L.Map.prototype, 'setView');

    // request for location
    const location_control_button = await screen.findByTestId("location-control-button");
    await act(() => fireEvent.click(location_control_button))
    
    // expect to be asked for location
    expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledTimes(1)
    
    // expect to set map view to current location
    expect(map_spy).toHaveBeenCalledWith([53.517973081770315, -113.51254457938089], expect.any(Number))

  });

  test("FR2 - request location, decline and do not set map view", async () => {

    const mockGeolocation = {
      getCurrentPosition: jest.fn()
        .mockImplementationOnce((_, error) =>
          Promise.resolve(error({}))),
    };

    (global as any).navigator.geolocation = mockGeolocation;

    const map_spy = jest.spyOn(L.Map.prototype, 'setView');
    
    // request for location
    const location_control_button = await screen.findByTestId("location-control-button");
    await act(() => fireEvent.click(location_control_button))
    
    // expect to be asked for location
    expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledTimes(1)

    // expect map to not set view
    expect(map_spy).toHaveBeenCalledTimes(0)
  });
});

/*
  FR5 - Display.Sensors - The system should display a marker with its real time BC
  AQHI+ value and be colored depending on the risk. The color scaling follows the Alberta
  AQHI color scale along with its corresponding PM2.5 concentration in ug/cm3.
  */
  describe('FR5 - DisplaySensors', () => {

    test('FR5 - create sensors with the correct aqhi and color', async () => {

      // PurpleAir markers
      // iterate possible AQHI values
      for (let i = 0; i <= 11; i++) {
        // create marker with AQHI value
        const marker = createPurpleAirSensorIcon(i)

        // expect marker to contain the AQHI value
        expect(marker.options.html).toContain(i.toString())

        // expect the marker to have the correct color
        expect(marker.options.className).toContain(getColor(i))
      }

      // Station Markers
      // iterate possible AQHI values
      for (let i = 0; i <= 11; i++) {
        // create marker with AQHI value
        const marker = createStationSensorIcon(i)

        // expect marker to contain the AQHI value
        expect(marker.options.html).toContain(i.toString())

        // expect the marker to have the correct color
        expect(marker.options.className).toContain(getColor(i))
      }
  
    });
  });

  /*
  FR7 - Display.Sensor.Data - The system shall display averaged sensor data as a
  pop-up in the time intervals of 10 minutes, 1-hour, 6-hour, and 24 hours when the
  user clicks on a sensor.
  */
  describe('FR7 - Display.Sensor.Data', () => {

    test('FR 7 - check that all sensors have the popup with data when clicked', async () => {
      
      const markers = await screen.findAllByTestId('purpleair-marker');

      for (const marker of markers) {
        const parent = marker.parentElement as Element;
        fireEvent.click(parent)
        await waitFor(() => screen.findByTestId("marker-popup"));
        const popup = await screen.findByTestId("marker-popup");

        // check that the popup contains the needed values
        expect(popup.textContent).toContain('10 min.')
        expect(popup.textContent).toContain('30 min.')
        expect(popup.textContent).toContain('1 hr.')
        expect(popup.textContent).toContain('6 hr.')
        expect(popup.textContent).toContain('24 hr.')
      }
    });
  });


describe('FR8 - Address.Input & FR 9 - Check.Distance & FR10 - Display.Nearest.Sensor', () => {

  beforeEach(async () => {

    const search = await screen.findByTestId("map-address-search");
    expect(search).toBeTruthy();

    // mock fetch to return an adress
    const mockFetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ results: [ {id: 0, position: {lat: 53.517973081770315, lon: -113.51254457938089}, address: {freeformAddress: "address"} }] }),
      })
    );

    (global as any).fetch = mockFetch;

    // search on the search bar to return an adress
    fireEvent.change(search, {target: {value: 'anything'}})

    // expect the text to update on the input element
    waitFor(() => expect(search.textContent).toBe('anything'))

    // expext fetch to have been called
    expect(mockFetch).toHaveBeenCalled()

  })

  /*
  FR8 - Address.Input - The system shall provide an interface for the user to enter addresses to retrieve AQIs for.
  */
  test('FR 8 - check that the interface was rendered and functional', async () => {

    // wait for result to render
    waitFor(() => screen.findByTestId("map-search-result"))
    const result = await screen.findByTestId("map-search-result");

    // expect address to be displayed in result
    expect(result.innerHTML).toBe('address')

    // spy on map set view method
    const map_spy = jest.spyOn(L.Map.prototype, 'setView');

    // click on result to set map view
    fireEvent.click(result)

    // expect to be redirected to the returned address
    expect(map_spy).toHaveBeenCalled()

  });

  /*
  FR9 - Check.Distance - The system shall check the distance from the address to
  the nearest sensor. If no sensor is found within 100m, let the user know and
  choose the closest sensor to the address.
  */
  test('FR 9 - check sensor distance', () => {
    
    const purpleair = mock_response.purpleair
    const stations = mock_response.station
    const distances = getSensorsWithDistance(53.517973081770315, -113.51254457938089, [
      ...stations,
      ...purpleair,
    ]);
    
    // check that our distance function is close to what a library reports
    for (const sensor of distances) {
      expect(sensor.distance)
        .toBeCloseTo(
        getDistance(
          {latitude: 53.517973081770315, longitude: -113.51254457938089},
          {latitude: sensor.latitude, longitude: sensor.longitude}
        ) / 1000, 0)
    }

  });
  
  /*
  FR10 - Display.Nearest.Sensor - The system shall display data from the nearest
  sensor and the distance from the sensor.
  */
  test('FR 10 - display nearest sensor and the distance from the sensor', async () => {
    
    // wait for result to render
    waitFor(() => screen.findByTestId("map-search-result"))
    const result = await screen.findByTestId("map-search-result");

    const popup_spy = jest.spyOn(L.Popup.prototype, 'openOn')

    // click on result to start calculating distances
    fireEvent.click(result)

    waitFor(() => screen.findByTestId("map-search-popup"));
    const popup = await screen.findByTestId("map-search-popup")

    // expect two popups to open on map, one for address, one for sensor
    expect(popup_spy).toHaveBeenCalledTimes(2)

    // expect popup to contain address returned by fetch
    expect(popup.innerHTML).toContain('address')

    // expect to display distance
    expect(popup.innerHTML).toContain('0.76 km')
   
  });

});
