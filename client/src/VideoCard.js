import React from 'react';
import {Card, ProgressBar, Button, ButtonGroup, ToggleButton}  from 'react-bootstrap';
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
            erp: null,
            roadid: null,
            carriageid: null,
            side: null,
            play: false,
            playicon: "play64blue.png",
            forwardicon: "seekForward64blue.png",
            interval: 500,

        }
        this.delegate(props.parent);
    }

    initialise(show, amazon, photoArray, index) {
        if(photoArray !== null) {
            this.setState({show: show});
            this.setState({photoArray: photoArray});
            this.setState({amazon: amazon});
            this.setState({counter: index});
            this.setState({currentPhoto: photoArray[index].photo});
            this.setState({erp: this.state.photoArray[index].erp});
            this.setState({roadid: this.state.photoArray[index].roadid});
            this.setState({carriageid: this.state.photoArray[index].carriageway});
            this.setState({side: 'L'});
            let latlng = this.getLatLng(index);
            this.delegate.setState({carMarker: [latlng]});
        } else {
            alert("photoarray null")
        }       
    }

    refresh(photoArray, photo, side) {
        let index = null;
        for (let i = 0; i < photoArray.length; i++) {
            if(photoArray[i].photo === photo.photo) {
                index = i;
                break;
            } 
        }
        if (index === null) {
            alert("error - photo not found");
            index = 0;
        }
        this.setState({currentPhoto: photoArray[index].photo});
        this.setState({photoArray: photoArray});
        this.setState({erp: this.state.photoArray[index].erp});
        this.setState({roadid: this.state.photoArray[index].roadid});
        this.setState({carriageid: this.state.photoArray[index].carriageway});
        this.setState({side: side});
        this.setState({counter: index});
        let latlng = this.getLatLng(index);
        this.delegate.setState({carMarker: [latlng]});
    }

    getSide() {
        return this.state.side;
    }

    getERP() {
        return this.state.erp;
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
                this.update(this.state.counter);
                this.setState({counter: this.state.counter + 1});           
            }, this.state.interval);  
        }
           
    }

    search(photo) {
        for(let i = 0; i < this.state.photoArray.length; i++) {
            if (photo === this.state.photoArray[i].photo) {
                this.setState({counter: i});
                this.update(i);
            }
        }
    }

    update(counter) {
        if (this.state.counter < this.state.photoArray.length) {
            this.setState({currentPhoto: this.state.photoArray[counter].photo});
            this.setState({erp: this.state.photoArray[counter].erp});
            let latlng = this.getLatLng(counter);
            this.delegate.setState({carMarker: [latlng]});
        } else {
            clearInterval(this.interval)
        }   
    }

    getLatLng(counter) {
        let lat = this.state.photoArray[counter].latitude;
        let lng = this.state.photoArray[counter].longitude;
        return new L.LatLng(lat, lng);
    }

    stopMovie() {
        clearInterval(this.interval);  
        this.setState({play: false});      
    }
      
    clickClose(e) {
        e.preventDefault();
        this.setState({show: false}); 
        clearInterval(this.interval); 
        this.setState({playicon: "play64blue.png"}); 
        this.setState({counter: 0});
        this.setState({show: false}); 
        this.setState({photoArray: []}); 
        this.setState({erp: null}); 
        this.setState({roadid: null}); 
        this.setState({carriageid: null}); 
        this.setState({side: null}); 
        this.delegate.setState({video: false}); 
        this.delegate.vidPolyline.then((line) => {
            line.setStyle({
                color: 'blue'
              });
        });
    }

    delegate(parent) {
      this.delegate = parent;
    }

    changeRadio(value) {
        this.setState({side: value});
        this.delegate.changeSide(this.state.carriageid, this.state.erp, value);
    }

    render() {
        if (this.state.show) {
            const radios = [
                { name: 'Left', value: 'L' },
                { name: 'Right', value: 'R' },
              ];
            
            return (
                <Card 
                  className="videoModal"
                >
                <Card.Body className="videoBody">	 
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
                              <span className='sidetext'>
                              <b>{"Road ID: "}</b> {this.state.roadid} <br></br> 
                                <b>{"Carriage ID: "} </b> {this.state.carriageid}<br></br>
                                <b>{"ERP: "}</b>{this.state.erp}<br></br>
                                <b>{"Side:  "}</b>
                                </span>
                                <ButtonGroup className="sidebuttons" toggle>
                                {radios.map((radio, idx) => (
                                <ToggleButton
                                    key={idx}
                                    type="radio"
                                    variant="outline-light"
                                    name="radio"
                                    size="sm"
                                    value={radio.value}
                                    checked={this.state.side === radio.value}
                                    onChange={(e) => this.changeRadio(e.currentTarget.value)}
                                    //onClick={(e) => this.clickRadio(e)}
                                >
                                    {radio.name}
                                </ToggleButton>
                                ))}
                            </ButtonGroup>  
                          </div>
                      </div>
                  </div>	
                  <Button 
                    className="videoCloseButton"
                    variant="light" 
                    size="sm"
                    onClick={(e) => this.clickClose(e)}>
                    Close
                </Button>  
                  </Card.Body >
              </Card>
              );
        } else {
            return (<div></div>)
        }
      
  }
}