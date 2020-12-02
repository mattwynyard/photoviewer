import React from 'react';
import {Modal, Button}  from 'react-bootstrap';
import {pad, sleep} from  './util.js'

export default class VideoModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            amazon: props.amazon,
            currentPhoto: null,
            show: props.show,
            counter: 0,
            photoArray: null,
        }
    }

   

    setModal(show, amazon, photoArray) {
        console.log(photoArray)
        if(photoArray !== null) {
            this.setState({show: show});
            this.setState({photoArray: photoArray});
            this.setState({amazon: amazon});
            this.setState({currentPhoto: photoArray[0].photo});
        } else {
            alert("photoarray null")
        }
        
    
    }

    clickStop(e) {
        e.preventDefault();
        this.setState({currentPhoto: this.state.photoArray[this.state.centeredcounter].photo});
    }
        
    clickPlay(e) {
        e.preventDefault();
        this.interval = setInterval(() => {
            this.playMovie(this.state.counter);
            this.setState({counter: this.state.counter + 1});
            
        }, 500);     
    }

    playMovie(counter) {
        if (this.state.counter < this.state.photoArray.length) {
            this.setState({currentPhoto: this.state.photoArray[counter].photo});
        } else {
            console.log("stop");
            clearInterval(this.interval);
        }   
    }
      
    closePhotoModal(e) {
        this.setState({show: false}); 
        clearInterval(this.interval);    
    }

    delegate(parent) {
      this.delegate = parent;
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
            onClick={(e) => this.clickPlay(e)}/>         
        </div>
      </Modal.Body >
      <Modal.Footer>
    
      </Modal.Footer>
    </Modal>
    );
  }
}