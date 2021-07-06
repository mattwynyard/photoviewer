import React from 'react';
import {Modal, Button}  from 'react-bootstrap';
import {pad} from  './util.js'

export default class PhotoModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedGLMarker: props.marker,
            amazon: props.amazon,
            currentPhoto: props.currentPhoto,
            type: null,
            show: props.show,
            latlng: null,
            callbackUpdateStatus: props.callbackUpdateStatus,
            login: props.login
        }
    }

   

    setModal(show, marker, amazon, currentPhoto, login) {
      console.log(marker)
        this.setState({show: show});
        this.setState({login: login});
        this.setState({type: marker[0].type});
        this.setState({latlng: marker[0].latlng});
        this.setState({amazon: amazon});
        this.setState({currentPhoto: currentPhoto});
        this.setState({selectedGLMarker: marker});

    
    }

    setArchiveModal(show, obj, amazon) {
      
      this.setState({show: show});
      this.setState({amazon: amazon});
      this.setState({type: 'archive'});
      this.setState({currentPhoto: obj[0].photo});
      this.setState({selectedGLMarker: obj});
      console.log(this.state.selectedGLMarker);
    }

    getPhoto(direction) {
        let photo = this.state.currentPhoto;
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
        this.setState({currentPhoto: newPhoto});
        return newPhoto;
      }

    clickPrev(e) {
        e.preventDefault();
        const newPhoto = this.getPhoto("prev");
        this.setState({currentPhoto: newPhoto});
        const url = this.state.amazon + newPhoto + ".jpg";
        this.setState({photourl: url});
        }
        
    clickNext(e) {
        e.preventDefault();
        const newPhoto = this.getPhoto("next");
        this.setState({currentPhoto: newPhoto});
        const url = this.state.amazon + newPhoto + ".jpg";
        this.setState({photourl: url});
    }

    changeSlider = (e) => {
      
    }

    changeDate(e) {
      e.preventDefault();
      console.log(e.target.value);
      this.setState({repaired: e.target.value});
    }


    clickSlider(e) {
      if (this.state.repaired === "") {
        return;
      }
      if (!this.state.checked) {
        this.setState(() => ({
          status: "active", 
          checked: true
        }));  
      } else {
        this.setState(() => ({
          status: "completed", 
          checked: false
        }));    
      } 
      this.delegate.updateStatusAsync(this.state.selectedGLMarker, this.state.status, this.state.repaired);
    }
      
    closePhotoModal(e) {
        this.setState({show: false});     
    }

    delegate(parent) {
      this.delegate = parent;
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
      const DateBox = function(props) {
        if (props.status === "active") {
          return (
            <div>
              <label><b>{"Date Repaired: "} </b></label>
              <input
                value={props.repaired}
                type="date" 
                id="daterepaired"
                onChange={props.onChange}
                >
              </input>
            </div>     
          );
        } else {
          return (
            <div>
              <label><b>{"Date Repaired: "}</b> {props.repaired}</label>
            </div>     
          );
        }
        
      }

      const Slider = function(props) {
        //if (props.login === "Login") {
          return ( <div>
            <label className="lbstatus">
              <b>Status:</b> {props.status}
            </label>
            </div>);
        // } else {
        //   return (
        //     <div>
        //       <label className="lbstatus">
        //         <b>Status:</b> {props.status}
        //       </label>
        //       <label 
        //         className="switch">
        //         <input 
        //           type="checkbox"
        //           checked={props.checked}
        //           onClick={props.onClick}
        //           onChange={props.onChange}
        //         >
        //         </input>
        //         <span className="slider round"></span>
        //       </label>
        //     </div>
        //   );
        //}
        
      }
  
      const CustomTable = function(props) {
        if(props.obj.type === "road") {
          return (
            <div className="container">
              <div className="row">
                <div className="col-md-4">
                <b>{"Fault ID: "}</b> {props.obj.id} <br></br> 
                  <b>{"Priority: "} </b> {props.obj.priority} <br></br>
                  <b>{"Location: "} </b> {props.obj.location}<br></br>
                  <b>{"Lat: "}</b>{props.obj.latlng.lat}<b>{" Lng: "}</b>{props.obj.latlng.lng + "  "}  
                  <Button variant="outline-secondary" 
                    size="sm" 
                    onClick={props.copy} 
                    active >Copy
                  </Button>
                </div>
                <div className="col-md-4">
                  <b>{"Fault: "} </b> {props.obj.fault} <br></br>
                  <b>{"Repair: "}</b>{props.obj.repair}<br></br> 
                  <b>{"Width: "}</b> {props.obj.width} m<br></br> 
                  <b>{"Length: "}</b> {props.obj.length} m
                </div>
                <div className="col-md-4">
                <b>{"Start ERP: "} </b> {props.obj.starterp}<br></br> 
                  <b>{"End ERP: "} </b> {props.obj.enderp}<br></br> 
                  <b>{"DateTime: "} </b> {props.obj.datetime}<br></br> 
                  <b>{"Status: "} </b> {props.obj.status}
                </div>
              </div>
            </div>	 
          );
        } else if(props.obj.type === "footpath") {      
          return (
            <div className="container">
              <div className="row">
                <div className="col-md-4">
                  <b>{"Fault ID: "}</b> {props.obj.id} <br></br> 
                  <b>{"Grade: "} </b> {props.obj.grade} <br></br>
                  <b>{"Location: "} </b> {props.obj.roadname}<br></br>
                  <b>{"Lat: "}</b>{props.obj.latlng.lat}<b>{" Lng: "}</b>{props.obj.latlng.lng + "  "}  
                  <Button variant="outline-secondary" 
                    size="sm" 
                    onClick={props.copy} 
                    active >Copy
                  </Button>
                </div>
                <div className="col-md-4">
                  <b>{"Type: "}</b> {props.obj.fault} <br></br> 
                  <b>{"Cause: "}</b>{props.obj.cause} <br></br> 
                  <b>{"Width: "}</b> {props.obj.width} m<br></br> 
                  <b>{"Length: "}</b> {props.obj.length} m
                </div>
                <div className="col-md-4">
                  <b>{"Start ERP: "} </b> {props.obj.starterp}<br></br> 
                  <b>{"End ERP: "} </b> {props.obj.enderp}<br></br> 
                  <b>{"DateTime: "} </b> {props.obj.datetime}<br></br> 
                  <b>{"Status: "} </b> {props.obj.status}
                </div>
                </div>
              </div>	 
          );
      
        } else {
          return (
            <div></div>
          );
        }     
      }
      return (
      <Modal dialogClassName={"photoModal"} 
          show={this.state.show} 
          size='xl' 
          centered={true}
          onHide={(e) => this.closePhotoModal(e)}
      >
      <Modal.Body className="photoBody">	
        <div className="container">
        {this.state.selectedGLMarker.map((obj, index) => 
          <img
            key={`${index}`}  
            className="photo" 
            alt="fault"
            src={this.state.amazon + this.state.currentPhoto + ".jpg"} 
              >
          </img>
        )}
          <img 
            className="leftArrow" 
            src={"leftArrow_128.png"} 
            alt="left arrow"
            onClick={(e) => this.clickPrev(e)}/> 
          <img 
            className="rightArrow" 
            src={"rightArrow_128.png"} 
            alt="right arrow"
            onClick={(e) => this.clickNext(e)}/>         
        </div>
      </Modal.Body >
      <Modal.Footer>
        <CustomTable 
          obj={this.state.selectedGLMarker[0]}
          login={this.state.login}
          copy={(e) => this.copyToClipboard(e, this.state.latlng)}
          >      
        </CustomTable >
      </Modal.Footer>
    </Modal>
    );
  }
}