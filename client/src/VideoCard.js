import React from 'react';
import {Card, ProgressBar, Button}  from 'react-bootstrap';
import L from 'leaflet';

export default class VideoCard extends React.Component {
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
            forwardicon: "seekForward64blue.png",
            interval: 500
        }
        this.delegate(props.parent);
    }

    initialise(show, amazon, photoArray) {
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
            }, this.state.interval);  
        }
           
    }

    playMovie(counter) {
        if (this.state.counter < this.state.photoArray.length) {
            this.setState({currentPhoto: this.state.photoArray[counter].photo});
            this.setState({erp: this.state.photoArray[counter].erp});
            let lat = this.state.photoArray[counter].latitude;
            let lng = this.state.photoArray[counter].longitude;
            let latlng = new L.LatLng(lat, lng);
            this.delegate.setState({carMarker: [latlng]});
        } else {
            clearInterval(this.interval)
        }   
    }

    stopMovie() {
        clearInterval(this.interval);  
        this.setState({play: false});      
    }
      
    clickClose(e) {
        this.setState({show: false}); 
        clearInterval(this.interval); 
        this.setState({playicon: "play64blue.png"}); 
        this.setState({counter: 0});
        this.setState({show: false});  
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
        if (this.state.show) {
            return (
                <Card 
                  className="videoModal"
                >
                <Card.Body className="videoBody">	
                <Button 
                    variant="outline-secondary" 
                    size="sm"
                    onClick={(e) => this.clickClose(e)}>
                    Close
                </Button>    
                  <div>
                    <img
                      className="video" 
                      alt="fault"
                      src={this.state.amazon + this.state.currentPhoto + ".jpg"} 
                        >
                    </img>     
                  </div>
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
                    
                  </Card.Body >
              </Card>
              );
        } else {
            return (<div></div>)
        }
      
  }
}