// This component covers Functional Requirement 4
const { app } = require('@azure/functions');
const CosmosClient = require("@azure/cosmos").CosmosClient
const { EmailClient } = require("@azure/communication-email");

const AQHI_PLUS = (pm25) => {
  const aqhi = Math.ceil(pm25/10);
  return aqhi != 0 ? aqhi : 1;
}

async function fetch_station_data() {
  const bbox = encodeURIComponent(process.env['STATION_BBOX'])
  
  const url = `https://api.weather.gc.ca/collections/aqhi-observations-realtime/items?bbox=${bbox}&offset=0&sortby=-latest&latest=true&f=json`
  const response = await fetch(url, {method: "GET"});
  const monitors = await response.json();
  return monitors.features;
}

function parse_station_data(response) {

  response.forEach((monitor) => {
    monitor.type = "station"
    monitor.latitude = monitor.geometry.coordinates[1]
    monitor.longitude = monitor.geometry.coordinates[0]
    monitor.observation_datetime = monitor.properties.observation_datetime
    monitor.location_name = monitor.properties.location_name_en
    monitor.aqhi = monitor.properties.aqhi
    delete monitor.geometry
    delete monitor.properties
  });

  return response;
}

function parse_purpleair_data(response) {
  const indices = {};
  response.fields.forEach((field, index) => {
    indices[field] = index;
  });

  const sensors = {};
  const data_time_stamp = response.data_time_stamp;
  response.data.forEach((data) => {
    const temp = {};
    response.fields.forEach((field) => {
      if (field === "sensor_index") {
        temp.id = data[indices[field]].toString();
        temp.type = "purpleair";
        temp.data_ts = data_time_stamp;
        return;
      }
      if (field === "pm2.5_60minute") {
        temp.aqhi_plus = AQHI_PLUS(data[indices[field]]);
      }

      temp[field] = data[indices[field]];
    })
    sensors[data[indices["sensor_index"]]] = temp;
  });   
  return sensors;
}

// FR4 - Fetch.Sensor.Data - The system should use Purple Air API to retrieve the real-time data for the sensors.
async function fetch_purpleair_sensor_data(context) {
  const group_id = process.env['PURPLEAIR_GROUP_ID'];
  const api_key = process.env['PURPLEAIR_KEY'];
  const parameters = process.env['PURPLEAIR_FIELDS'] 
  const url = `https://api.purpleair.com/v1/groups/${group_id}/members?fields=${parameters}`;

  const headers = new Headers({
      "X-API-Key": api_key
  });

  const response = await fetch(url, {method: "GET", headers: headers});
  context.log(response);
  let sensors = await response.json();

  return sensors;
}

async function create_sensor_data_item(sensor_data, client, container_id) {
  const database_id = process.env['COSMOS_DATABASE_ID'];

  await client
    .database(database_id)
    .container(container_id)
    .items.upsert(sensor_data);
}

async function fetch_alerts_data(client, database_id, container_id) {
    const alerts = await client
    .database(database_id)
    .container(container_id)
    .items.readAll()
    .fetchAll();

    return alerts
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

async function sendEmailAlert(context, to, subject, message, connectionString) {
    const emailClient = new EmailClient(connectionString);
    const emailContent = {
        subject: subject,
        plainText: message,
    };

    const emailMessage = {
        senderAddress: "DoNotReply@8dc032a4-9ad2-43f0-9644-21d95fb61cb9.azurecomm.net",
        recipients: {
            to: [{ address: to }],
        },
        content: emailContent,
    };

    const poller = await emailClient.beginSend(emailMessage);
    const result = await poller.pollUntilDone();

    context.log(to, emailContent, connectionString);

    if (result) {
        context.log(`Email sent to ${to}: MessageId: ${result}`);
    } else {
        context.error(`Failed to send email to ${to}`);
    }
}

async function toggleIsAbove(alert, client){
    alert.isabove = !alert.isabove; 
    await client.database(process.env["COSMOS_DATABASE_ID"])
        .container(process.env['COSMOS_ALERTS_CONTAINER_ID'])
        .items.upsert(alert);
}

async function sendAlerts(context, client, alerts, purpleair_sensors, station_sensors){

    await alerts.resources.forEach(async (alert) => {
        // Find the 3 closest PurpleAir sensors
        const distancesPurpleAir = Object.values(purpleair_sensors).map(sensor => ({
          ...sensor,
          distance: calculateDistance(alert.latitude, alert.longitude, sensor.Latitude, sensor.Longitude),
        })).sort((a, b) => a.distance - b.distance).slice(0, 3);
      
        // Find the closest Station sensor
        const distancesStation = Object.values(station_sensors).map(sensor => ({
          ...sensor,
          distance: calculateDistance(alert.latitude, alert.longitude, sensor.latitude, sensor.longitude),
        })).sort((a, b) => a.distance - b.distance).slice(0, 1);

        // Counter for sensors below threshold
        let belowThresholdCount = 0; 
        for (let i = 0; i < distancesPurpleAir.length; i++) {
          const sensor = distancesPurpleAir[i];
          // Check if any sensor crosses above the threshold
          if (sensor.aqhi_plus >= alert.threshold && !alert.isabove) {
              context.log(`Alert ${alert.name}: PurpleAir sensor ${sensor.id} crossed above threshold with AQHI+ of ${sensor.aqhi_plus}`);
            
            // Send the email to alert the user
            const emailSubject = `Alert '${alert.name}': Threshold Crossed`;
            const emailMessage = `PurpleAir sensor ${sensor.id} crossed above threshold with AQHI+ of ${sensor.aqhi_plus}.`;
            await sendEmailAlert(context, alert.username, emailSubject, emailMessage, process.env['AZURE_COMMUNICATION_SERVICES_CONNECTION_STRING']);
        
            // Update the alert item in Cosmos DB
            alert.isabove = !alert.isabove; 
            await client.database(process.env["COSMOS_DATABASE_ID"])
                .container(process.env['COSMOS_ALERTS_CONTAINER_ID'])
                .items.upsert(alert);

            break; 
          }
        
          // Check if sensor is below threshold
          if (sensor.aqhi_plus < alert.threshold && alert.isabove) {
            belowThresholdCount++;
          }
        }
        
        const station = distancesStation[0]
        // Compare AQHI of the closest Station sensor with the alert threshold
        if(Math.round(station.aqhi) >= alert.threshold && !alert.isabove) {
            
            context.log(`Alert '${alert.name}': Station ${station.location_name} exceeds threshold with AQHI of ${Math.round(station.aqhi)}`)

            // Send the email to alert the user
            const emailSubject = `Alert '${alert.name}': Threshold Crossed`;
            const emailMessage = `Agency station '${station.location_name}' crossed above threshold with AQHI of ${Math.round(station.aqhi)}.`;
            await sendEmailAlert(context, alert.username, emailSubject, emailMessage, process.env['AZURE_COMMUNICATION_SERVICES_CONNECTION_STRING']);

            // Update the alert item in Cosmos DB
            alert.isabove = !alert.isabove; 
            await client.database(process.env["COSMOS_DATABASE_ID"])
                .container(process.env['COSMOS_ALERTS_CONTAINER_ID'])
                .items.upsert(alert);

        } else if (Math.round(station.aqhi) < alert.threshold && alert.isabove) {
            belowThresholdCount++;
        }

        // After the loop, check if all sensors have dropped below threshold
        if (belowThresholdCount === (distancesPurpleAir.length + 1) && alert.isabove) {
            context.log(`Alert ${alert.name}: Sensors closest to address dropped below threshold.`);

            // Send the email to alert the user
            const emailSubject = `Alert '${alert.name}': Threshold Dropped`;
            const emailMessage = `All sensors dropped below AQHI/AQHI+ threshold value of ${alert.threshold}.`;
            await sendEmailAlert(context, alert.username, emailSubject, emailMessage, process.env['AZURE_COMMUNICATION_SERVICES_CONNECTION_STRING']);

            // Update the alert item in Cosmos DB
            alert.isabove = !alert.isabove; 
            await client.database(process.env["COSMOS_DATABASE_ID"])
                .container(process.env['COSMOS_ALERTS_CONTAINER_ID'])
                .items.upsert(alert);
        }
    });
}

app.timer('FetchSensorData', {
    schedule: '0 5 * * * *',
    handler: async (myTimer, context) => {

      const options = {
        endpoint: process.env['COSMOS_ENDPOINT'],
        key: process.env['COSMOS_KEY'],
      };
    
      try {
        const client = new CosmosClient(options);
    
        const purpleair_response = await fetch_purpleair_sensor_data(context);
        const station_response = await fetch_station_data(context);

        const purpleair_sensors = parse_purpleair_data(purpleair_response);
        const station_sensors = parse_station_data(station_response);
    
        for (const sensor of Object.values(purpleair_sensors)) {
          await create_sensor_data_item(sensor, client, process.env['COSMOS_PURPLEAIR_CONTAINER_ID']);
        }

        for (const station of station_sensors) {
          await create_sensor_data_item(station, client, process.env['COSMOS_STATION_CONTAINER_ID']);
        }

        const alerts = await fetch_alerts_data(client, process.env["COSMOS_DATABASE_ID"], process.env['COSMOS_ALERTS_CONTAINER_ID']);

        await sendAlerts(context, client, alerts, purpleair_sensors, station_sensors);

      } catch (err) {
        context.log(err);
        throw err;
      }
    }
});
