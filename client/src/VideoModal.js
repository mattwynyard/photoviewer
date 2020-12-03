import React from 'react';
import {Modal, ProgressBar}  from 'react-bootstrap';
import {pad, sleep} from  './util.js'

export default class VideoModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            amazon: props.amazon,
            currentPhoto: null,
            show: props.show,
            counter: 0,
            photoArray: [],
            play: false,
            playicon: "play64blue.png",
            forwardicon: "seekForward64blue.png"
        }
    }

   

    setModal(show, amazon, photoArray) {
        if(photoArray !== null) {
            this.setState({show: show});
            this.setState({photoArray: photoArray});
            this.setState({amazon: amazon});
            this.setState({currentPhoto: photoArray[0].photo});
            this.setState({erp: this.state.photoArray[0].erp});
            this.setState({roadid: this.state.photoArray[0].roadid});
            this.setState({carriageid: this.state.photoArray[0].carriageway});
        } else {
            alert("photoarray null")
        }        
    }

    clickStop(e) {
        e.preventDefault();
        this.setState({currentPhoto: this.state.photoArray[this.state.centeredcounter].photo});
    }

    clickProgress(e) {
        e.preventDefault();
        console.log(e.clientX - 300);
        console.log(e.clientY - 300);
    }
        
    clickPlay(e) {
        e.preventDefault();
        if (this.state.play) {
            this.setState({play: false});
            this.setState({playicon: "play64blue.png"});
            this.stopMovie();
        } else {
            this.setState({play: true}); 
            this.setState({playicon: "pause64blue.png"});
            this.interval = setInterval(() => {
                this.playMovie(this.state.counter);
                this.setState({counter: this.state.counter + 1});           
            }, 500);  
        }
           
    }

    playMovie(counter) {
        if (this.state.counter < this.state.photoArray.length) {
            this.setState({currentPhoto: this.state.photoArray[counter].photo});
            this.setState({erp: this.state.photoArray[counter].erp});
        } else {
            clearInterval(this.interval);
        }   
    }

    stopMovie() {
        clearInterval(this.interval);  
        this.setState({play: false});      
    }
      
    closePhotoModal(e) {
        this.setState({show: false}); 
        clearInterval(this.interval); 
        this.setState({playicon: "play64blue.png"}); 
        this.setState({counter: 0}); 
        this.delegate.vidPolyline.then((line) => {
            line.setStyle({
                color: 'blue'
              });
        });

    }

    delegate(parent) {
      this.delegate = parent;
    }
    
    render() {
      return (
      <Modal 
        dialogClassName="videoModal"
        show={this.state.show} 
        size='lg'
        centered={true}
        onHide={(e) => this.closePhotoModal(e)}
      >
      <Modal.Body className="videoBody">	
        <div>
          <img
            className="video" 
            alt="fault"
            src={this.state.amazon + this.state.currentPhoto + ".jpg"} 
              >
          </img>     
        </div>
      </Modal.Body >
      <Modal.Footer className="videoFooter">
            <ProgressBar 
                className="videoProgress" 
                min={0} 
                max={this.state.photoArray.length} 
                now={this.state.counter} 
                onClick={(e) => this.clickProgress(e)}
            /> 
        <div>
            <img 
                className="play" 
                src={this.state.playicon} 
                alt="play button"
                onClick={(e) => this.clickPlay(e)}
            />     
        </div>
        <div className="videoText">
            <div className="row">
                <div className="col-md-4">
                <b>{"Road ID: "}</b> {this.state.roadid} <br></br> 
                    <b>{"Carriage ID: "} </b> {this.state.carriageid}<br></br>
                    <b>{"ERP: "}</b>{this.state.erp}
                </div>
            </div>
        </div>	 
        
      
      </Modal.Footer>
    </Modal>
    );
  }
}