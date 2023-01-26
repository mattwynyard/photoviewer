import { Polygon } from 'react-leaflet';
import React from 'react';
import { CircleMarker} from 'react-leaflet';



const buildLocationTriangle = (center, rotation, size) => {
    const points = [];
        const x0 = Math.round(center.x + (size * Math.cos((rotation * (Math.PI / 180)) * Math.PI / 3)));
        const y0 = Math.round(center.y + (size * Math.sin((rotation * (Math.PI / 180)) * Math.PI / 3)));
        const x1 = Math.round(center.x + (size * Math.cos((rotation * (Math.PI / 180)) + 2 * Math.PI / 3)));
        const y1 = Math.round(center.y + (size * Math.sin((rotation * (Math.PI / 180)) + 2 * Math.PI / 3)));
        const x2 = Math.round(center.x + (size * Math.cos((rotation * (Math.PI / 180)) + 4 * Math.PI / 3)));
        const y2 = Math.round(center.y + (size * Math.sin((rotation * (Math.PI / 180)) + 4 * Math.PI / 3)));
        points.push([x0, y0], [Math.round(center.x), Math.round(center.y)], [x1, y1], [x2, y2])
    return points;
}

export const LeafletTriangle = (props) => {
    const points = buildLocationTriangle(props.center,props.bearing + 30, props.radius * 3);
    const latlngs = [];
    points.forEach((point) => {
        const latlng = props.map.containerPointToLatLng(point)
        latlngs.push(latlng)
    })
    return (
        <Polygon 
            positions={latlngs}
            pathOptions={{color: props.color}}
            stroke={true}
            weight={2}
            opacity={1.0}
            fillColor={props.color}
            fillOpacity={1.0}
            eventHandlers={{
                mouseover: (e) => {
                    e.target.openPopup();
                },
                mouseout: (e) => {
                    e.target.closePopup();
                }
            }}
        >
        </Polygon>

    );
}

export default function Location(props) {
    if (props.marker) {
        const center = props.map.latLngToContainerPoint(props.marker.position[0]);
        return (
            <>
            {/* <CircleMarker
                center={props.marker.position[0]}
                radius ={12}
                pathOptions={{color: "grey"}}
                stroke={true}
                weight={1}
                opacity={1}
                fillColor={"grey"}
                fillOpacity={0.8}
            >
            </CircleMarker> */}
            <LeafletTriangle  
                data={props.marker.position[0]} 
                bearing={props.marker.bearing}
                radius={4} 
                center={center} 
                color={"blue"}
                map={props.map}
            >   
            </LeafletTriangle>

            </>   
        ) 
    } else {
        return null;
    }
    
}