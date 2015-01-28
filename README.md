node-arcgisserver
=================

node.js tools to administer an ESRI ArcGIS for Server site

## Installation

```
$ npm install node-arcgisserver -g
```

## Usage

### Service Statistics

Report statistics on services for an ArcGIS for Server site

```
$ ags servicestatistics -h servername:6080 -u username -p password
```

Output

```
servername:6080
---
Folders: 25
Services: 66
Public Services: 59
Cached Map Services: 8
---
Service Types
GPServer: 9
MapServer: 46
GeocodeServer: 9
GeometryServer: 1
SearchServer: 1
---
Statuses
Started: 63
Stopped: 3
---
Instances
Maximum Possible Instances: 178
Current Instances Busy: 0
Current Instances Free: 59
```

### Service List

List services configured on an ArcGIS for Server site

```
$ ags servicelist -h servername:6080 -u username -p password
```

Additional Options

- --cached: list only cached map services
- --public: list only public services
- --private: list only private services
- --started: list only started services
- --stopped: list only stopped services
- --service-type <type>: list only services matching the specified service type (GPServer, MapServer, GeocodeServer, SearchServer)
- --verbose: include service descriptions in addition to folder and service names')

Output

```
servername:6080
---
/service1
/service2
folder1/service1
folder2/service1
folder2/service2
```