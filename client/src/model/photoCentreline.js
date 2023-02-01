import L from 'leaflet';
import { latLngsFromGeojson } from  '../util.js';

export const leafletPolylineFromGeometry = (geometry, options) => {
    const geojson = JSON.parse(geometry.data.geojson);
    const latlngs = latLngsFromGeojson(geojson.coordinates);
    return L.polyline(latlngs, {
      class: geometry.data.class,
      controller: geometry.data.controller,
      cwid: geometry.data.cwid,
      direction: geometry.data.direction,
      endm: geometry.data.endm,
      hierarchy: geometry.data.hierarchy,
      label: geometry.data.label,
      owner: geometry.data.owner,
      pavement: geometry.data.pavement,
      photos: null,
      roadid: geometry.data.roadid,
      roadtype: geometry.data.roadtype,
      startm: geometry.data.startm,
      tacode: geometry.data.tacode,
      town: geometry.data.town,
      width: geometry.data.width,
      zone: geometry.data.zone,
      color: options.color,
      weight: options.weight,
      opacity: options.opacity,
    });
}
    