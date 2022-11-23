import React from 'react';
import { Modal, Button }  from 'react-bootstrap';
import { incrementPhoto } from  '../util.js';
import { FetchHead } from '../api/FetchHead'

import './PhotoModal.css';

export default class PhotoModal extends React.Component {
  
    constructor(props) {
        
        super(props);
        this.state = {
            marker: [],
            amazon: null,
            show: false,
            photo: null,
            date: null,
            time: null,
            command: null,
            enabled: true
        }
    }


    showModal(show, login, marker, amazon, photo) {
      this.setState({marker: marker});
      this.setState({photo: photo});
      this.setState({date: marker[0].datetime.split('T')[0]});
      this.setState({time: marker[0].datetime.split('T')[1].substr(0,8)});
      if (login === 'asu') {
        this.setState({amazon: amazon + marker[0].inspection + "/"});
        this.setState({show: show});
      } else {
        if (marker[0].type === 'footpath') {
          if (marker[0].asset.toLowerCase() === 'kerb & channel') {
            this.setState({amazon: `${amazon}kerbs/${marker[0].inspection}/`});
          } else {
            this.setState({amazon: `${amazon}footpaths/${marker[0].inspection}/`});
          }
        } else {
          this.setState({amazon: amazon});
        }       
        this.setState({show: show});
      }
    }

    setArchiveModal(show, marker, amazon) {
      this.setState({marker: marker});
      this.setState({amazon: amazon});
      this.setState({photo: marker[0].photo});
      this.setState({show: show});
    }
    
    clickPrev = async (photo, callback) => {
      if (this.state.enabled) {
        this.setState({enabled: false}, async () => {
          const newPhoto = incrementPhoto(photo, -1);
          let url = `${this.state.amazon}${newPhoto}.jpg`;
          let status = await callback(url);
          //console.log(status)
          if (status !== 404) {
            this.setState({
              photo: newPhoto,
              enabled: true
            })  
          } else {
            this.setState({
              enabled: true
            }, () => {
              this.clickPrev(newPhoto, callback);
            })       
          }
        })  
      }
    }
        
    clickNext = async (photo, callback) => {
      if (this.state.enabled) {
        this.setState({enabled: false}, async () => {
          const newPhoto = incrementPhoto(photo, 1);
          let url = `${this.state.amazon}${newPhoto}.jpg`;
          let status = await callback(url);
          //console.log(status)
          if (status !== 404) {
            this.setState({
              photo: newPhoto,
              enabled: true
            }) 
          } else {
            this.setState({
              enabled: true
            }, () => {
              this.clickNext(newPhoto, callback);
            })
            
          }
        })
      }  
    }
      
    closePhotoModal = () => {
        this.setState({
          show: false, 
        }); 
           
    }

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
        if(props.obj.type === "road") {
          return (
            <div className="col-md-8"  >
                  <DataColumn data={[
                    {name: "Fault ID: ", data: props.obj.id},
                    {name: "Priority: ", data: props.obj.priority},
                    {name: "Road ID: ", data: props.obj.roadid},
                    {name: "Carriage ID: ", data: props.obj.carriage},
                    {name: "Location: ", data: props.obj.location},
                    {name: "Fault: ", data: props.obj.fault},
                    {name: "Repair: ", data: props.obj.repair},
                    {name: "Width: ", data: props.obj.width, symbol: " m"},
                    {name: "Length: ", data: props.obj.length, symbol: " m"},
                    {name: "Count: ", data: props.obj.count},
                    {name: "Start ERP: ", data: props.obj.starterp},
                    {name: "End ERP: ", data: props.obj.enderp} 
                    ]}>
                  </DataColumn>  
                  <div>
                  <b>{"Date: "}</b>{this.state.date}<br></br>
                  <b>{"Time: "}</b>{this.state.time}<br></br>
                  <b>{"Lat: "}</b>{this.state.marker[0].latlng.lat}<br></br>
                  <b>{"Lng: "}</b>{this.state.marker[0].latlng.lng + "  "}<br></br>
                  <b>{"Photo: "}</b>{this.state.photo + "  "}<br></br>
                  <Button variant="outline-secondary" 
                    size="sm" 
                    onClick={this.copy} 
                    >Copy
                  </Button> 
                  </div>     
              </div>
          );
        } else if(props.obj.type === "footpath") {      
          return (
            <div className="col-md-8" >
              <DataColumn data={[
                {name: "Fault ID: ", data: props.obj.id},
                {name: "Grade: ", data: props.obj.grade},
                {name: "Road ID: ", data: props.obj.roadid},
                {name: "Footpath ID: ", data: props.obj.footpathid},
                {name: "Location: ", data: props.obj.roadname},
                {name: "Fault: ", data: props.obj.fault},
                {name: "Cause: ", data: props.obj.cause},
                {name: "Width: ", data: props.obj.width, symbol: " m"},
                {name: "Length: ", data: props.obj.length, symbol: " m"},
                {name: "Count: ", data: props.obj.count},
                {name: "Start ERP: ", data: props.obj.starterp},
                {name: "End ERP: ", data: props.obj.enderp},
                ]}>
              </DataColumn>   
              <div>
                <b>{"Date: "}</b>{this.state.date}<br></br>
                <b>{"Time: "}</b>{this.state.time}<br></br>
                <b>{"Lat: "}</b>{this.state.marker[0].latlng.lat}<br></br>
                <b>{"Lng: "}</b>{this.state.marker[0].latlng.lng + "  "}<br></br>
                <b>{"Photo: "}</b>{this.state.photo + "  "}<br></br>
                <Button variant="outline-secondary" 
                  size="sm" 
                  onClick={this.copy} 
                  >Copy
                </Button>  
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
        <Modal.Body >	
          <div>
            <img className="photo"    
              alt="photo"
              src={this.state.amazon + this.state.photo + ".jpg"} 
              //onError={(e) => this.imageError(e)}
              />  
            <div className="dataTable">   
            <CustomTable 
              obj={this.state.marker[0]}
              copy={(e) => this.copyToClipboard(e, this.state.latlng)}>      
            </CustomTable>
          </div > 
            <img 
              className="leftArrow" 
              src={"leftArrow_128.png"} 
              alt="left arrow"
              onClick={() => this.clickPrev(this.state.photo, FetchHead)}/> 
            <img
              className="rightArrow" 
              src={"rightArrow_128.png"} 
              alt="right arrow"
              onClick={() => this.clickNext(this.state.photo, FetchHead)}/>  
          
        </div>
        </Modal.Body >
    </Modal>
    );
  }
}