import React, { Component } from 'react';
import {Dropdown}  from 'react-bootstrap';
import {haversineDistance} from  '../util.js';
import './Roadlines.css';

export default class Roadlines extends Component {

    constructor(props) {
        super(props);
        this.state = {
            project: null,
            login: null,
            token: null,
            host: null,
            menu: ["Structural Rating", "Surface Rating", "Drainage Rating"],
            filter: [],
            active: false,
            data: JSON.parse(window.sessionStorage.getItem('centrelines')) || null,
        }
    }

    componentDidMount() {
      
    }

    componentWillUnmount() {
      window.sessionStorage.setItem('centrelines', JSON.stringify(this.state.data));
    }

    setProject(project) {
      this.setState({project: project.layer});
      this.setState({login: project.login});
      this.setState({host: project.host});
      this.setState({token: project.token});

    }

    setDelegate(delegate) {
      this.delegate = delegate;
    }

    isActive() {
      return this.state.active
    }

    reset() {
      this.setState(
        {
          data: null,
          filter: [],
          active: false,
        }
        );
    }
    
    redraw = (value) => {
        let options = {type: "centreline", value: value}
        let centrelines = this.delegate.loadLines([], this.state.data, options);
        let glData = this.delegate.glData;
        glData.centre = centrelines.vertices;
        this.delegate.redraw(glData, false);   
    }

    async loadCentrelines(project) {
      //if (this.state.login !== "Login") {
        await fetch('https://' + this.state.host + '/centrelines', {
          method: 'POST',
          headers: {
            "authorization": this.state.token,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user: this.state.login,
            project: project
          })
        }).then(async (response) => {
          const body = await response.json();
          if (body.error != null) {
            alert(`Error: ${body.error}\n`);
          } else {
            if (body.data) {
              this.setState({data: body.data});
            }
          }   
        })
        .catch((error) => {
          console.log("error: " + error);
          alert(error);
          return;
        });
      }

   clickCheck = (e, value) => {
     if (this.isChecked(value)) {
      this.setState({filter: []});
      this.delegate.glData.layers[0].geometry = [];
      let glData = this.delegate.glData;
      this.setState({active: false});
      this.delegate.redraw(glData, false);
     } else {
      this.setState({active: true})
      this.setState(
        {filter: [value]},
        () => {
          let options = {type: "centreline", value: value}
          let centrelines = this.delegate.loadLines([], this.state.data, options);
          let glData = this.delegate.glData;
          glData.layers[0].geometry = centrelines.vertices;
          this.delegate.redraw(glData, false);
        });
     }     
    }

    erp = (geometry, erp, latlng) => {
      let distance = erp.start;
      for (let i= 0; i < geometry.coordinates.length - 1; i++) { //check if on line
        let dxl = geometry.coordinates[i + 1][0] - geometry.coordinates[i][0];
        let dyl = geometry.coordinates[i + 1][1] - geometry.coordinates[i][1];
        let box = {
          point1: geometry.coordinates[i],
          point2: geometry.coordinates[i + 1]
        }
        let result = this.inBoundingBox(dxl, dyl, box, latlng);
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

    inBoundingBox(dxl, dyl, box, point) {
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

    /**
     * 
     * @param {line start point} a 
     * @param {line end point} b 
     * @param {point to check} c 
     * @returns 
     */
    inBetween(a, b , c) {
      let crossproduct = (c.lat - a[1]) * (b[0] - a[0]) - (c.lng - a[0]) * (b[1] - a[1]);
      console.log(crossproduct)
      let epsilon = 0.000001;
      if (Math.abs(crossproduct) > epsilon)
          return false
      let dotproduct = (c.lng - a[0]) * (b[0] - a[0]) + (c.lat - a[1]) * (b[1] - a[1])
      if (dotproduct < 0)
          return false;
      let squaredlengthba = (b[0] - a[0]) * (b[0] - a[0]) + (b[1] - a[1]) * (b[1] - a[1])
      if (dotproduct > squaredlengthba)
          return false;
      return true;
    }

    changeCheck = (value) => {
    }

    isChecked = (value) => {
      if (this.state.filter.includes(value)) {
        return true;
      } else {
        return false;
      }
      
    }

    render() {
      if (this.state.project) {
        return (
          <Dropdown className="centreline">
          <Dropdown.Toggle variant="light" size="sm" >
              Rating
            </Dropdown.Toggle>
            <Dropdown.Menu className="centrelinemenu">
              {this.state.menu.map((value, index) =>
              <div key={`${index}`}>
              <input
                key={`${index}`} 
                id={value} 
                type="checkbox" 
                checked={this.isChecked(value)}
                onClick={(e) => this.clickCheck(e, value)}
                onChange={(e) => this.changeCheck(value)}
                >
              </input>{" " + value}<br></br>
            </div> 
            )}
          </Dropdown.Menu>
        </Dropdown> 
        );
      } else {
        return null;
      }
    }
  }
