# Sentinel City 

### Unified Urban Operations & Public-Health Decision Support

Sentinel City is a map-based urban operations and public-health decision-support platform designed to help cities monitor incidents, visualize geographic information, and support informed response planning.

## Project Overview

Sentinel City brings together hospital-reported health information, incident monitoring, geographic visualization, and environmental indicators in a unified dashboard. It aims to improve situational awareness and help public-health and city-response teams identify areas that may need further attention.

## Key Features

* **Interactive City Map:** Geographic visualization of districts, incidents, and relevant city information.
* **Hospital Reporting:** Supports reporting and reviewing health-related information.
* **Incident Management:** Organizes reported incidents by priority and potential impact.
* **Advanced Analytics:** Dashboard panels for reviewing trends and operational indicators.
* **AI-Assisted Insights:** Optional AI integration to support analysis and interpretation.
* **Response Simulation:** Provides a way to explore possible response scenarios.
* **Role-Based Dashboards:** Different views for citizens, pharmacists, hospitals, and administrators.
* **City Readiness Monitoring:** Visual indicators for infrastructure and essential services.

## Technology Stack

**Frontend**

* React.js
* Vite
* JavaScript
* Leaflet

**Backend**

* Node.js
* Express.js
* REST APIs

**Data & Analytics**

* JSON-based data storage
* Data visualization
* Optional external API and AI integration

## Project Structure

```text
Sentinel_City/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   ├── api.js
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── index.html
│
├── backend/
│   ├── server.js
│   └── package.json
│
├── .gitignore
└── README.md
```

## Installation & Setup

### Prerequisites

* Node.js
* npm
* Git

### 1. Clone the repository

```bash
git clone https://github.com/saksham2004Aditya/Sentinel_city1.git
cd Sentinel_city1
```

### 2. Start the backend

```bash
cd backend
npm install
node server.js
```

### 3. Start the frontend

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL displayed by Vite in your browser, usually `http://localhost:5173`.

> If your project uses environment variables or a different backend start script, configure these according to the project's setup.

##  Environmental Data & Public-Health Context

Sentinel City is designed to combine aggregated hospital-reported information with environmental observations, including potential satellite-derived indicators such as flooding and surface-water changes.

Satellite observations do not directly detect diseases or identify infected individuals. Environmental indicators are intended to provide context for human review and public-health decision-making.

##  Project Impact

Sentinel City aims to:

* Improve city-level situational awareness.
* Support the geographic review of reported incidents and health trends.
* Help coordinate attention and response planning.
* Encourage data-informed decisions while maintaining human oversight.

## Future Scope

* Integration of verified live satellite-derived environmental data.
* Secure and privacy-conscious health-data handling.
* Improved analytics and explainable alerts.
* Testing and validation with public-health stakeholders.
* Reliable deployment and real-time data integration.

##  Team

**Project:** Sentinel City
**Developer / Team Lead:** Saksham Atreya

## Disclaimer

Sentinel City is a decision-support prototype. Its visualizations and analytical outputs should not be treated as medical diagnoses, confirmed outbreak predictions, or verified real-time city intelligence unless supported by validated data and testing.

## Repository

GitHub: https://github.com/saksham2004Aditya/Sentinel_city1
