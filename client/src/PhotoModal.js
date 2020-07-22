import React from 'react';
import {Modal, Button}  from 'react-bootstrap';
import {pad} from  './util.js'

<<<<<<< HEAD
const CustomSlider = function(props) {
    if (props.status === "active") {
      return (
        <div>
          <label className="lbstatus">
            Status: {props.status}
          </label>
          <label 
            className="switch">
            <input 
              type="checkbox"
              checked={true}
              onChange={props.callbackOnChange}
              onClick={props.onClick}
            >
            </input>
            <span className="slider round"></span>
          </label>
        </div>
      );
    } else {
        return (
            <div>
              <label className="lbstatus">
                Status: {props.status}
              </label>
              <label 
                className="switch">
                <input 
                  type="checkbox"
                  checked={false}
                  onChange={props.callbackOnChange}
                  onClick={props.onClick}
                >
                </input>
                <span className="slider round"></span>
              </label>
            </div>
          );
    }
}

const CustomTable = function(props) {
    if(props.obj.type === "road") {
      return (
        <div className="container">
          <div className="row">
            <div className="col-md-6">
                <b>{"Type: "}</b> {props.obj.fault} <br></br> 
                <b>{"Location: "} </b> {props.obj.location}<br></br>
                <b>{"Lat: "}</b>{props.obj.latlng.lat}<b>{" Lng: "}</b>{props.obj.latlng.lng}
            </div>
            <div className="col-md-6">
              <b>{"Priority: "} </b> {props.obj.priority} <br></br>
              <b>{"Repair: "}</b>{props.obj.repair}<br></br> 
              <b>{"DateTime: "} </b> {props.obj.datetime}
            </div>
          </div>
        </div>	 
      );
    } else if(props.obj.type === "footpath") {
      
      return (
        <div className="container">
          <div className="row">
            <div className="col-md-6">
            <b>{"Fault ID: "}</b> {props.obj.id} <br></br> 
                <b>{"Priority: "} </b> {props.obj.grade} <br></br>
                <b>{"Location: "} </b> {props.obj.roadname}<br></br>
                <b>{"Lat: "}</b>{props.obj.latlng.lat}<b>{" Lng: "}</b>{props.obj.latlng.lng + "  "}  
                <Button variant="outline-secondary" 
                 size="sm" 
                 onClick={props.copy} 
                 active >Copy
                 </Button>
            </div>
            <div className="col-md-6">
              <b>{"Type: "}</b> {props.obj.fault} <br></br> 
              <b>{"Cause: "}</b>{props.obj.cause} <br></br> 
              <b>{"Size: "}</b> {props.obj.size} m<br></br> 
              <b>{"DateTime: "} </b> {props.obj.datetime}
            </div>
          </div>
        </div>	 
      );
    }    
  }

=======
>>>>>>> 3001dc08609730d0ccaa5f63a5a9a42e3eb4b221
export default class PhotoModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedGLMarker: props.marker,
            amazon: props.amazon,
            currentPhoto: props.currentPhoto,
            type: null,
            show: props.show,
            status: null,
            checked: null
        }
    }

    setModal(show, marker, amazon, currentPhoto, type) {
        console.log(marker);
        this.setState({show: show});
        this.setState({type: marker[0].type});
        this.setState({status: marker[0].status});
        this.setState({amazon: amazon});
        this.setState({currentPhoto: currentPhoto});
        this.setState({selectedGLMarker: marker});

        if (marker[0].status === "active") {
          this.setState({checked: true});
        } else {
          this.setState({checked: false});
        }
    
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

    changeSlider(e) {
      console.log(e.target.checked)
      console.log("state" + this.state.checked) 
    }

    clickSlider(e) {
        e.preventDefault();
        console.log(this.state.checked);
        
        if (!this.state.checked) {
          this.setState({status: "active", checked: true});  
          console.log("click");
        } else {
          this.setState({status: "completed", checked: false});    
        } 
        console.log("state" + this.state.checked)  
    }
      
    closePhotoModal(e) {
        e.preventDefault();
        this.setState({show: false});     
    }

    render() {
      console.log("state-render " + this.state.checked);
      let checked = this.state.checked;
      const CustomTable = function(props) {
        if(props.obj.type === "road") {
          return (
            <div className="container">
              <div className="row">
                <div className="col-md-6">
                    <b>{"Type: "}</b> {props.obj.fault} <br></br> 
                    <b>{"Location: "} </b> {props.obj.location}<br></br>
                    <b>{"Lat: "}</b>{props.obj.latlng.lat}<b>{" Lng: "}</b>{props.obj.latlng.lng}
                </div>
                <div className="col-md-6">
                  <b>{"Priority: "} </b> {props.obj.priority} <br></br>
                  <b>{"Repair: "}</b>{props.obj.repair}<br></br> 
                  <b>{"DateTime: "} </b> {props.obj.datetime}
                </div>
              </div>
            </div>	 
          );
        } else if(props.obj.type === "footpath") {
          
          return (
            <div className="container">
              <div className="row">
                <div className="col-md-6">
                <b>{"Fault ID: "}</b> {props.obj.id} <br></br> 
                    <b>{"Priority: "} </b> {props.obj.grade} <br></br>
                    <b>{"Location: "} </b> {props.obj.roadname}<br></br>
                    <b>{"Lat: "}</b>{props.obj.latlng.lat}<b>{" Lng: "}</b>{props.obj.latlng.lng + "  "}  
                    <Button variant="outline-secondary" 
                     size="sm" 
                     onClick={props.copy} 
                     active >Copy
                     </Button>
                </div>
                <div className="col-md-6">
                  <b>{"Type: "}</b> {props.obj.fault} <br></br> 
                  <b>{"Cause: "}</b>{props.obj.cause} <br></br> 
                  <b>{"Size: "}</b> {props.obj.size} m<br></br> 
                  <b>{"DateTime: "} </b> {props.obj.datetime}
                </div>
              </div>
            </div>	 
          );
        }    
      }
        return (
        <Modal dialogClassName={"photoModal"} 
            show={this.state.show} 
            size='xl' 
            centered={true}
            onHide={() => this.setState({show: false})}
        >
        <Modal.Body className="photoBody">	
          <div className="container">
          {this.state.selectedGLMarker.map((obj, index) => 
            <img
              key={`${index}`}  
              className="photo" 
              src={this.state.amazon + this.state.currentPhoto + ".jpg"} 
                >
            </img>
          )}
            <img 
              className="leftArrow" 
              src={"leftArrow_128.png"} 
              onClick={(e) => this.clickPrev(e)}/> 
            <img 
              className="rightArrow" 
              src={"rightArrow_128.png"} 
              onClick={(e) => this.clickNext(e)}/>
             
          </div>
		    </Modal.Body >
        <Modal.Footer>
        {this.state.selectedGLMarker.map((obj, index) =>  
          <div key={`${index}`}>
            <label className="lbstatus">
              Status: {this.state.status}
            </label>
            <label 
              className="switch">
              <input 
                type="checkbox"
                checked={checked}
                onClick={(e) => this.clickSlider(e)}
                onChange={(e) => this.changeSlider(e)}
              >
              </input>
              <span className="slider round"></span>
            </label>
        </div>
        )}
        {this.state.selectedGLMarker.map((obj, index) =>  
          <CustomTable
            key={`${index}`}  
            obj={obj}
            //TODO copy not working
            // copy={(e) => this.copyToClipboard(e, () => this.getGLFault('latlng'))}
            >       
          </CustomTable >
          )}
          <Button variant="primary" onClick={(e) => this.closePhotoModal(e)}>
            Close
          </Button>
          
        </Modal.Footer>
      </Modal>
    );
    }
}