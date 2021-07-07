import { FieldBinaryOutlined } from '@ant-design/icons';
import React from 'react';
import {Modal, Button}  from 'react-bootstrap';
import {pad} from  './util.js'

export default class PhotoModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            marker: [],
            amazon: null,
            show: false,
            photo: null,

        }
    }

    showModal(show, marker, amazon) {
      this.setState({marker: marker});
      this.setState({photo: marker[0].photo});
      this.setState({amazon: amazon});
      this.setState({show: show});

    }

    setArchiveModal(show, marker, amazon) {
      this.setState({marker: marker});
      this.setState({amazon: amazon});
      this.setState({photo: marker[0].photo});
      this.setState({show: show});

    }

    getPhoto(direction) {
      let photo = this.state.photo;
      let intSuffix = (parseInt(photo.slice(photo.length - 5, photo.length)));
      let n = null;
      if (direction === "prev") {
        n = intSuffix - 1;
      } else {
        n = intSuffix + 1;
      }
      let newSuffix = pad(n, 5);
      let prefix = photo.slice(0, photo.length - 5);
      let newPhoto = prefix + newSuffix;
      return newPhoto;
    }

    clickPrev = (e) => {
      e.preventDefault();
      const newPhoto = this.getPhoto("prev");
      this.setState({photo: newPhoto});
    }
        
    clickNext = (e) => {
      e.preventDefault();
      const newPhoto = this.getPhoto("next");
      this.setState({photo: newPhoto});
    };
      
    closePhotoModal = () => {
        this.setState({show: false});     
    };

      /**
     * Copies the lat lng from photo modal to users clipboard
     * @param {*} e button lcick event
     * @param {*} latlng Leaflet latlng object
     */
    copyToClipboard(e, latlng) {
      e.preventDefault();
      console.log(latlng)
      const position = latlng.lat + " " + latlng.lng
      navigator.clipboard.writeText(position);
    }

    render() {
      const DataColumn = (props) => {
        return (
            <div>
            {props.data.map((field, index) => 
              <DataRow key={index.toString()} name={field.name} data={field.data} symbol={field.symbol}></DataRow>    
            )}
            </div>
        );
      }
      const DataRow = (props) => {
        return (
            <div>
            {props.data ? <div><b>{props.name}</b>{props.data}{props.symbol}</div>: null}
            </div>
        );
      }
      const CustomTable = (props) => {
        console.log(props.obj)
        if(props.obj.type === "road") {
          return (
            <div className="container">
              <div className="row">
                <div className="col-md-4">
                  <DataColumn className="col-md-4" data={[
                    {name: "Fault ID: ", data: props.obj.id},
                    {name: "Priority: ", data: props.obj.priority},
                    {name: "Road ID: ", data: props.obj.roadid},
                    {name: "Carriage ID: ", data: props.obj.carriage},
                    {name: "Location: ", data: props.obj.location}
                    ]}>
                  </DataColumn>   
                </div>
                <div className="col-md-4">
                  <DataColumn className="col-md-4"data={[
                      {name: "Fault: ", data: props.obj.fault},
                      {name: "Repair: ", data: props.obj.repair},
                      {name: "Width: ", data: props.obj.width, symbol: " m"},
                      {name: "Length: ", data: props.obj.length, symbol: " m"},
                      {name: "Count: ", data: props.obj.count}
                      ]}>
                  </DataColumn>
                  </div>
                <div className="col-md-4">
                  <DataColumn className="col-md-4"data={[
                      {name: "Start ERP: ", data: props.obj.starterp},
                      {name: "End ERP: ", data: props.obj.enderp},
                      {name: "DateTime: ", data: props.obj.datetime},
                      ]}>

                </DataColumn>
                <b>{"Lat: "}</b>{props.obj.latlng.lat}<b>{" Lng: "}</b>{props.obj.latlng.lng + "  "}
                  <Button variant="outline-secondary" 
                    size="sm" 
                    onClick={props.copy} 
                    active >Copy
                  </Button>
                </div>
              </div>
            </div>	 
          );
        } else if(props.obj.type === "footpath") {      
          return (
            <div className="container">
              <div className="row">
                <div className="col-md-4">
                  <DataColumn className="col-md-4" data={[
                    {name: "Fault ID: ", data: props.obj.id},
                    {name: "Grade: ", data: props.obj.grade},
                    {name: "Road ID: ", data: props.obj.roadid},
                    {name: "Footpath ID: ", data: props.obj.footpathid},
                    {name: "Location: ", data: props.obj.roadname}
                    ]}>
                  </DataColumn>   
                </div>
                <div className="col-md-4">
                  <DataColumn className="col-md-4"data={[
                      {name: "Fault: ", data: props.obj.fault},
                      {name: "Cause: ", data: props.obj.cause},
                      {name: "Width: ", data: props.obj.width, symbol: " m"},
                      {name: "Length: ", data: props.obj.length, symbol: " m"},
                      {name: "Count: ", data: props.obj.count}
                      ]}>
                  </DataColumn>
                  </div>
                <div className="col-md-4">
                  <DataColumn className="col-md-4"data={[
                      {name: "Start ERP: ", data: props.obj.starterp},
                      {name: "End ERP: ", data: props.obj.enderp},
                      {name: "DateTime: ", data: props.obj.datetime},
                      ]}>

                </DataColumn>
                <b>{"Lat: "}</b>{props.obj.latlng.lat}<b>{" Lng: "}</b>{props.obj.latlng.lng + "  "}
                  <Button variant="outline-secondary" 
                    size="sm" 
                    onClick={props.copy} 
                    active >Copy
                  </Button>
                </div>
              </div>
            </div>	  
          );     
        } else {
          return (
            null
          );
        }     
      }

      return (
      <Modal dialogClassName={"photoModal"} 
          show={this.state.show} 
          size='xl' 
          centered={true}
          onHide={this.closePhotoModal}
      >
      <Modal.Body className="photoBody">	
        <div className="container">
        {this.state.marker.map((obj, index) => 
          <img
            key={`${index}`}  
            className="photo" 
            alt="fault"
            src={this.state.amazon + this.state.photo + ".jpg"} 
              >
          </img>
        )}
          <img 
            className="leftArrow" 
            src={"leftArrow_128.png"} 
            alt="left arrow"
            onClick={this.clickPrev}/> 
          <img 
            className="rightArrow" 
            src={"rightArrow_128.png"} 
            alt="right arrow"
            onClick={this.clickNext}/>         
        </div>
      </Modal.Body >
      <Modal.Footer>
        <CustomTable 
          obj={this.state.marker[0]}
          copy={(e) => this.copyToClipboard(e, this.state.latlng)}
          >      
        </CustomTable >
      </Modal.Footer>
    </Modal>
    );
  }
}