import React from 'react';
import {Card, ProgressBar, Button, ToggleButton}  from 'react-bootstrap';
import L from 'leaflet';
import './VideoCard.css';

export default class VideoCard extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            amazon: null,
            show: false,
            index: 0,
            side: null,
            disabled: false,
            play: false,
            playicon: "play_128.png",
            forwardicon: "seekForward64blue.png",
            interval: 500,
            mode: null

        }
        this.delegate(props.parent);
        this.photoArray = null;
    }

    initialise(mode, side, direction, amazon, photoArray, index) {
        if(photoArray !== null) {
            console.log(index)
            this.setState({show: true});
            this.setState({mode: mode});
            this.photoArray = photoArray;
            this.setState({amazon: amazon});
            this.setState({index: index});
            this.setState({side: side});
            if (direction === 'Both') {
                this.setState({disabled: false});
            } else {
                this.setState({disabled: true});
            }
            
            let latlng = this.getLatLng(index);
            this.delegate.setState({carMarker: [latlng]});
        } else {
            alert("photoarray null")
        }       
    }

    refresh(photo, photoArray) {
        const index = photoArray.findIndex((element) => element.photo === photo.photo) 
        if (index === -1) {
            alert("error - photo not found");
            return;
        }
        this.photoArray = photoArray;  
        this.setState({side: photo.side});
        this.setState({index: index});
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
        
    clickPlay(e) {
        e.preventDefault();
        if (this.state.play) {
            this.setState({play: false});
            this.setState({playicon: "play_128.png"});
            this.stopMovie();
        } else {
            this.setState({play: true}); 
            this.setState({playicon: "pause_128.png"});
            this.interval = setInterval(() => {
                this.update(this.state.index + 1);
                           
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

    update(index) {
        if (this.state.index < this.photoArray.length) {
            this.setState({index: index});
            let latlng = this.getLatLng(index);
            this.delegate.setState({carMarker: [latlng]});
        } else {
            clearInterval(this.interval)
        }   
    }

    getLatLng(index) {
        const geojson = JSON.parse(this.photoArray[index].st_asgeojson);
        const lat = geojson.coordinates[1];
        const lng = geojson.coordinates[0];;
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
        this.setState({playicon: "play_128.png"}); 
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

    changeRadio(e) {
        this.delegate.changeSide(this.photoArray[this.state.index], 'L');
        this.setState({side: e});
    }
    render() {

        const IdText = function(props) {
            if (props.mode === "road") {
                return (<div className='sidetext'>
                    <div>
                    <b>{"Road ID: "}</b> {props.roadid} <br></br>
                    <b>{"Carriage ID: "} </b> {props.id}<br></br>
                    <b>{"ERP: "}</b>{props.erp}<br></br>
                    </div>
                  </div>);
            } else {
                return (<div className='sidetext'>
                <b>{"Road ID: "}</b> {props.roadid} <br></br>
                  <b>{"Footpath ID: "} </b> {props.id}<br></br>
                  <b>{"ERP: "}</b>{props.erp}<br></br>
                  </div>);
            }
        }

        if (this.state.show) {
            if (!this.photoArray) return null;
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
                      src={this.state.amazon + this.photoArray[this.state.index].photo + ".jpg"} 
                        >
                    </img>     
                  </div>
                  <ProgressBar 
                    className="videoProgress" 
                    min={0} 
                    max={this.photoArray.length} 
                    now={this.state.counter} 
                    />
                    <div className="controls">
                        <IdText
                            className="controls-text"
                            mode={this.state.mode}
                            roadid={this.state.roadid}
                            id={this.state.id}
                            erp={this.state.erp}
                        ></IdText>
                        <div className="controls-play" >
                            <div>
                            <img   
                                src={this.state.playicon} 
                                alt="play button"
                                onClick={(e) => this.clickPlay(e)}
                            />  
                            </div>   
                        </div>
                        <div className="controls-toggle">
                            {radios.map((radio, idx) => (
                            <ToggleButton
                                key={idx}
                                type="radio"
                                variant="light"
                                name="radio"
                                size="sm"
                                value={radio.value}
                                disabled={this.state.disabled}
                                checked={this.state.side === radio.value}
                                onChange={(e) => this.changeRadio(e.currentTarget.value)}
                            >
                                {radio.name}
                            </ToggleButton>
                            ))}	
                            </div>
                        <Button 
                            className="controls-close"
                            variant="light" 
                            size="sm"
                            onClick={(e) => this.clickClose(e)}>
                            Close
                        </Button>
                    </div>  
                </Card.Body >
              </Card>
              );
        } else {
            return (
                null
            );          
        }
      
  }
}