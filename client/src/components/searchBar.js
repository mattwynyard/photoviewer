
// import React, { useRef, useState, useEffect, useImperativeHandle } from 'react';
// import {InputGroup, FormControl, Button}  from 'react-bootstrap';
// import L from 'leaflet';

// const SearchBar = React.forwardRef((props, ref) => {

//     const [search, setSearch] = useState("");
//     const [district] = useState(props.district);
//     const [map, setMap] = useState(props.map);
//     const [latlng] = useState();

//     const centreMap = (latlngs) => {
//       console.log(map);
//       if (!map) return;
//       if (latlngs.length !== 0) {
//           let bounds = L.latLngBounds(latlngs);
//           map.fitBounds(bounds);
//       } else {
//           return;
//       }
//       let textbox = document.getElementById("search");
//       if (this.state.search !== null) {
//           textbox.value = "";
//           this.setState({search: null});
//       }
//     }
    
//     const clickSearch = async(e) => {
//         e.preventDefault();
//         if (search === "" || search === null) return;
//         console.log(search)
//         let tokens = null

//         tokens = search.split(" ");
    
//         if(!tokens) return;
//         let searchString = "";
//         for (let i = 0; i < tokens.length; i++) {
//           if (i !== tokens.length - 1) {
//             searchString += tokens[i] + "+";
//           } else {
//             searchString += tokens[i];
//           }
//         }
//         if (district !== null) {
//           searchString += "," + district
//         }
//         const response = await fetch("https://nominatim.openstreetmap.org/search?q=" + searchString + "&countrycodes=nz&format=json&addressdetails=1", {
//           method: 'GET',
//           credentials: 'same-origin',
//           headers: {
//             'Accept': 'application/json',
//             'Content-Type': 'application/json',        
//           },
//         });
//         const body = await response.json();
//         console.log(body);
//         if (response.status !== 200) {
//           alert(response.status + " " + response.statusText);  
//           throw Error(body.message);    
//         } 
//         if (body.length !== 0) {
//           if (body[0] !== "undefined" || body[0] !== "") {
//             let latlng1 = L.latLng(parseFloat(body[0].boundingbox[0]), parseFloat(body[0].boundingbox[2]));
//             let latlng2 = L.latLng(parseFloat(body[0].boundingbox[1]), parseFloat(body[0].boundingbox[3]));
//             centreMap([latlng1, latlng2])
//           }
//         }
        
//       }; 
//     return (
//         <InputGroup ref={ref}
//         className="search">
//         <FormControl 
//             className="search"
//             id="search"
//             placeholder="Search"
//             onChange={(e) => setSearch(e.target.value)}
//         />
//         <InputGroup.Append>
//             <Button className="searchButton" variant="light">
//             <img 
//                 className="searchicon" 
//                 src="search.png" 
//                 alt="magnifying glass" 
//                 width="24" 
//                 height="24"
//                 onClick={(e) => clickSearch(e)}>
//             </img>
//             </Button>
//         </InputGroup.Append>
//         </InputGroup>)
// });
// export {SearchBar};
