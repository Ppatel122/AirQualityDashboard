# Air-Quality Dashboard and GIS Mapping

## Introduction
This project was developed by ECE 493 students Roberto Villarreal Andrade, Pranj Patel and Jay Pasrija at the University of Alberta in collaboration with Professor Amina Hussein and the Tomorrow Foundation. The application provides real-time air quality monitoring using PurpleAir sensors and GIS mapping technology. Users can view air quality data, receive alerts, and gain insights to make informed health decisions.

You can explore the application here: [Air-Quality Dashboard](https://edmonton-air-quality-299f003c3f64.herokuapp.com/).  
*Note: Some functionality may be unavailable as maintenance has been transitioned to another student.*

## Features
- **Real-time Air Quality Monitoring**: Displays PM2.5 concentrations in real-time using PurpleAir sensors.
- **GIS Mapping**: Interactive visualization of air quality data on a map.
- **Customizable Alerts**: Email notifications based on user-defined air quality thresholds.
- **User Registration**: Personalize settings and manage alerts.

## Achievements
The project received the **Clean Air Award** for its contribution to environmental health and innovation:
- [Capital Airshed Clean Air Awards](https://capitalairshed.ca/news-events/clean-air-awards/)
- [University of Alberta Folio Article](https://www.ualberta.ca/en/folio/2024/06/u-of-a-project-could-help-children-in-daycare-breathe-easier.html)

## Technologies Used
- **Frontend**:
  - **JavaScript, React.js, Tailwind CSS**: For creating a responsive and user-friendly interface.
  - **Leaflet**: For GIS mapping.
  - **D3.js**: For advanced data visualization.
- **Backend & Database**:
  - **Azure Services**: Used for backend functions, database management, and email alerts.
  - **Cosmos DB**: For efficient and scalable data storage.
  - **Azure B2C**: For secure user authentication.
  - **Azure Email Service**: For delivering alert notifications.

## System Overview
The architecture consists of three main components:
1. **Frontend**: Built using React.js and styled with Tailwind CSS for responsive design. GIS functionalities are powered by Leaflet, and data visualizations are handled by D3.js.
2. **Backend**: Node.js backend deployed on Azure Function Apps ensures efficient processing of requests and seamless integration with external APIs.
3. **Data Sources**: Real-time air quality data is sourced from the PurpleAir API and GeoMet-OGC API. The system processes and updates data hourly to maintain accuracy and relevance.

## Functional Highlights
1. **Interactive Map**:
   - View air quality sensor locations in Edmonton.
   - Get real-time BC AQHI+ and PM2.5 values displayed on the map.
   - Zoom, pan, and click for detailed sensor data.
2. **Address-Based Search**:
   - Locate air quality data by entering an address or using current location services.
   - Displays data from the nearest sensor and highlights areas with poor air quality.
3. **Custom Alerts**:
   - Set thresholds for PM2.5 or BC AQHI+ levels.
   - Receive timely notifications when air quality exceeds limits or returns to safe levels.
4. **Data Visualization**:
   - Time-series plots showing historical air quality trends over adjustable time frames (hourly, daily, weekly, monthly).

## Future Directions
The system was designed with scalability in mind, allowing for:
- Expansion to include sensors outside Edmonton.
- Increased API call frequency for higher data granularity.
- Integration with additional air quality indices or environmental data sources.

## Usage and Limitations
This app provides a valuable tool for air quality monitoring and public health awareness. However, note that its data relies on external APIs and the accuracy of sensors. Users are encouraged to verify critical decisions with local health authorities during rapidly changing air conditions.

