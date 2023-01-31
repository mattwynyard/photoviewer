const EARTH_RADIUS = 6378137.0; //metres
const TILE_SIZE = 256;

const latLngsFromGeojson = (geojson) => {
  const coordinates = [];
  geojson.forEach( (coordinate) => {
    coordinates.push([coordinate[1], coordinate[0]]);
  }); 
  return coordinates;
}

const incrementPhoto = (photo, increment) => {
  const intSuffix = (parseInt(photo.slice(photo.length - 5, photo.length)));
  const n = intSuffix + increment;
  const newSuffix = pad(n, 5);
  const prefix = photo.slice(0, photo.length - 5);
  return prefix + newSuffix;
}

const erp = (geometry, erp, latlng) => {
  let distance = erp.start;
  for (let i= 0; i < geometry.coordinates.length - 1; i++) { //check if on line
    let dxl = geometry.coordinates[i + 1][0] - geometry.coordinates[i][0];
    let dyl = geometry.coordinates[i + 1][1] - geometry.coordinates[i][1];
    let box = {
      point1: geometry.coordinates[i],
      point2: geometry.coordinates[i + 1]
    }
    let result = inBoundingBox(dxl, dyl, box, latlng);
    if (result) {
      let d = haversineDistance(geometry.coordinates[i][1], geometry.coordinates[i][0], latlng.lat, latlng.lng)
      distance += d;
      break;
    } else {
      let d = haversineDistance(geometry.coordinates[i][1], geometry.coordinates[i][0], geometry.coordinates[i + 1][1], geometry.coordinates[i + 1][0])
      distance += d;
    }
  }
  return distance;
}

/**
 * 
 * @param {line start point} a 
 * @param {line end point} b 
 * @param {point to check} c 
 * @returns 
 */
// const inBetween = (a, b , c) => {
//   let crossproduct = (c.lat - a[1]) * (b[0] - a[0]) - (c.lng - a[0]) * (b[1] - a[1]);
//   let epsilon = 0.000001;
//   if (Math.abs(crossproduct) > epsilon)
//       return false
//   let dotproduct = (c.lng - a[0]) * (b[0] - a[0]) + (c.lat - a[1]) * (b[1] - a[1])
//   if (dotproduct < 0)
//       return false;
//   let squaredlengthba = (b[0] - a[0]) * (b[0] - a[0]) + (b[1] - a[1]) * (b[1] - a[1])
//   if (dotproduct > squaredlengthba)
//       return false;
//   return true;
// }

const inBoundingBox = (dxl, dyl, box, point) => {
  if (Math.abs(dxl) >= Math.abs(dyl)) {
    return dxl > 0 ? 
    box.point1[0] <= point.lng && point.lng <= box.point2[0] :
    box.point2[0] <= point.lng && point.lng <= box.point1[0];        
  } else {
    return dyl > 0 ? 
    box.point1[1] <= point.lat && point.lat <= box.point2[1] :
    box.point2[1] <= point.lat && point.lat <= box.point1[1];
  }
}

const calculateDistance = (points) => {
  const R = 6371 * 1000; // metres
  let metres = 0;
  for (let i = 0; i < points.length - 1; i++) {
    let lat1 = points[i].lat * Math.PI/180; //in radians
    let lat2 = points[i + 1].lat * Math.PI/180;
    let lng1 = points[i].lng * Math.PI/180; //in radians
    let lng2 = points[i + 1].lng * Math.PI/180;
    let deltaLat = (lat2-lat1);
    let deltaLng = (lng2-lng1);
    let a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    let d = R * c; // in metres
    metres += d;
  }
  return Number((metres).toFixed(0)); //total metres

}


// The download function takes a CSV string, the filename and mimeType as parameters
// Scroll/look down at the bottom of this snippet to see how download is called
const downloadCSV = (content, fileName, mimeType) => {
  let a = document.createElement('a');
  mimeType = mimeType || 'application/octet-stream';

  if (navigator.msSaveBlob) { // IE10
    navigator.msSaveBlob(new Blob([content], {
      type: mimeType
    }), fileName);
  } else if (URL && 'download' in a) { //html5 A[download]
    a.href = URL.createObjectURL(new Blob([content], {
      type: mimeType
    }));
    a.setAttribute('download', fileName);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    a.href = 'data:application/octet-stream,' + encodeURIComponent(content); // only this mime type is supported
  }
}

const geojsonToWkt = (gjson) => {
  let wkt = '"' + gjson.type.toUpperCase() + " ";
  if (gjson.type.toUpperCase() === 'LINESTRING') {
    gjson.coordinates.forEach((coordinate, index) => {
      if (index === 0) {
        wkt += '(' + coordinate[0] + ' ' + coordinate[1] + ',';
      } else if (index === gjson.coordinates.length - 1) {
        wkt += coordinate[0] + ' ' + coordinate[1] + ')"';
      }  else {
        wkt += coordinate[0] + ' ' + coordinate[1] + ',';
      }   
    });
  } else if (gjson.type.toUpperCase() === 'POINT') {
    wkt += '(' + gjson.coordinates[0] + ' ' + gjson.coordinates[1] + ')"';
  } else {
    return "";
  }
  return wkt;
}

const RDP = (l, eps) => {
    const last = l.length - 1;
    const p1 = l[0];
    const p2 = l[last];
    const x21 = p2.x - p1.x;
    const y21 = p2.y - p1.y;
   
    const [dMax, x] = l.slice(1, last)
        .map(p => Math.abs(y21 * p.x - x21 * p.y + p2.x * p1.y - p2.y * p1.x))
        .reduce((p, c, i) => {
          const v = Math.max(p[0], c);
          return [v, v === p[0] ? p[1] : i + 1];
        }, [-1, 0]);
   
    if (dMax > eps) {
      return [...RDP(l.slice(0, x + 1), eps), ...RDP(l.slice(x), eps).slice(1)];
    }
    return [l[0], l[last]]
  };

  let LatLongToPixelXY = (latitude, longitude) => {
    let pi_180 = Math.PI / 180.0;
    let pi_4 = Math.PI * 4;
    let sinLatitude = Math.sin(latitude * pi_180);
    let pixelX = ((longitude + 180) / 360) * TILE_SIZE;
    let pixelY = (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (pi_4)) * TILE_SIZE;
    let pixel = { x: pixelX, y: pixelY };
    return pixel;
  };

  let ShpericalLatLongToPixelXY = (latitude, longitude) => {
    let equator = 40075016.68557849;
    let pixelX = (longitude + (equator / 2.0)) / (equator / TILE_SIZE);
    let pixelY = (latitude - (equator / 2.0)) / (equator / TILE_SIZE);
    let pixel = { x: pixelX, y: pixelY };
    return pixel;
  };

  let haversineDistance = (lat1, lon1, lat2, lon2) => {
      let dLat = Math.PI / 180.0 * (lat2 - lat1);
      let dLon = Math.PI / 180.0 * (lon2 - lon1);
      lat1 = Math.PI / 180.0 * (lat1);
      lat2 = Math.PI / 180.0 * (lat2);

      let a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
        let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        let d = EARTH_RADIUS * c;
      return d;
  };

  /**
   * Calculates distance on earth surface
   */
  let calcGCDistance = (distance) => {
    return distance * EARTH_RADIUS * (Math.PI /180);
  }

  function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
      currentDate = Date.now();
    } while (currentDate - date < milliseconds);
  }

  function translateMatrix(matrix, tx, ty) {
    // translation is in last column of matrix
    matrix[12] += matrix[0] * tx + matrix[4] * ty;
    matrix[13] += matrix[1] * tx + matrix[5] * ty;
    matrix[14] += matrix[2] * tx + matrix[6] * ty;
    matrix[15] += matrix[3] * tx + matrix[7] * ty;
  }
  
  function scaleMatrix(matrix, scaleX, scaleY) {
    // scaling x and y, which is just scaling first two columns of matrix
    matrix[0] *= scaleX;
    matrix[1] *= scaleX;
    matrix[2] *= scaleX;
    matrix[3] *= scaleX;
    matrix[4] *= scaleY;
    matrix[5] *= scaleY;
    matrix[6] *= scaleY;
    matrix[7] *= scaleY;
  }
  
  // Returns a random integer from 0 to range - 1.
  function randomInt(range) {
    return Math.floor(Math.random() * range);
  }

  /**
   * 
   * @param {the number to pad} n 
   * @param {the amount of pading} width 
   * @param {digit to pad out number with (default '0'} z 
   * @return {the padded number (string)}
   */
  function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
    }

  /**
   * returns a random hex color
   */
  function getColor() {
    return '#' +  Math.random().toString(16).substr(-6);
  }

  function formatDate(date) {
    let tokens = date.split("_");
    let month = getMonth(tokens[1]);
    return month + " " + tokens[0];
  }

  function getMonth(month) {
    switch(month) {
      case "01":
        return "January";
      case "02":
        return "Feburary";
      case "03":
        return "March";
      case "04":
        return "April";
      case "05":
        return "May";
      case "06":
        return "June";
      case "07":
        return "July";
      case "08":
        return "August";
      case "09":
        return "September";
      case "10":
        return "October";
      case "11":
        return "November";
      case "12":
        return "December";
      default:
        return month
    }
  }

  export {incrementPhoto, RDP, haversineDistance, LatLongToPixelXY, ShpericalLatLongToPixelXY, translateMatrix, 
    scaleMatrix, randomInt, pad, getColor, getMonth, formatDate, calcGCDistance, sleep, downloadCSV, geojsonToWkt,
    calculateDistance, erp, latLngsFromGeojson}