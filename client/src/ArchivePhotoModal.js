import React from 'react';
import {Modal, Button}  from 'react-bootstrap';
import {pad} from  './util.js'

export default class ArchivePhotoModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            amazon: props.amazon,
            currentPhoto: props.currentPhoto,
            address: null,
            lat: null,
            lng: null,
            erp: null
        }
    }

    delegate(parent) {
        this.delegate = parent;
      }

    setArchiveModal(show, obj) {
      this.setState({show: show});
      this.setState({type: 'archive'});
      this.setState({amazon: obj.amazon});
      this.setState({currentPhoto: obj.photo});
      this.setState({lat: obj.lat});
      this.setState({lng: obj.lng});
      this.setState({erp: obj.erp});
      let address = this.buildAddress(obj.address);
      this.setState({address: address});

    }

    buildAddress(address) {
        let _address = "";
        if (typeof address.house_number !== 'undefined' || address.house_number != null) {
            _address += address.house_number + " "
        }
        if (typeof address.road !== 'undefined' || address.road != null) {
            _address += address.road + " "
        }
        if (typeof address.suburb !== 'undefined' || address.suburb != null) {
            _address += address.suburb + " "
        }
        if (typeof address.town !== 'undefined' || address.town != null) {
            _address += address.town
        }
        return _address;
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

    async clickPrev(e) {
      e.preventDefault();
      const newPhoto = this.getPhoto("prev");
      this.setState({currentPhoto: newPhoto});
      const url = this.state.amazon + newPhoto + ".jpg";
      this.setState({photourl: url});
      await this.delegate.getArchiveData(newPhoto);
    }
        
    async clickNext(e) {
      e.preventDefault();
      const newPhoto = this.getPhoto("next");
      this.setState({currentPhoto: newPhoto});
      const url = this.state.amazon + newPhoto + ".jpg";
      this.setState({photourl: url});
      await this.delegate.getArchiveData(newPhoto);
    }
      
    closePhotoModal(e) {
        this.setState({show: false});     
    }

      /**
     * Copies the lat lng from photo modal to users clipboard
     * @param {*} e button lcick event
     * @param {*} latlng Leaflet latlng object
     */
    copyToClipboard(e, latlng) {
      //e.preventDefault();
      const position = latlng.lat + " " + latlng.lng
      navigator.clipboard.writeText(position);
    }

    
    render() {

      return (
      <Modal dialogClassName={"photoModal"} 
          show={this.state.show} 
          size='xl' 
          centered={true}
          onHide={(e) => this.closePhotoModal(e)}
      >
      <Modal.Body className="photoBody">	
        <div className="container">
          <img
            className="photo" 
            alt="fault"
            src={this.state.amazon + this.state.currentPhoto + ".jpg"} 
              >
          </img>
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
        <div className="container">
            <div className="row">
                <div className="col-md-4">
                    <b>{"Address: "}</b> {this.state.address} <br></br> 
                    <b>{"Lat: "}</b>{this.state.lat}<b>{" Lng: "}</b>{this.state.lng}
                </div>
                <div className="col-md-4">
                <b>{"ERP: "}</b> {this.state.erp} <br></br> 
            </div> 
            </div>   
            
        </div>
      </Modal.Footer>
    </Modal>
    );
  }
}