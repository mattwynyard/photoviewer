import React from 'react';
import {Card, ProgressBar, Button, ToggleButton}  from 'react-bootstrap';
import L from 'leaflet';
import './VideoCard.css';
import {ReactComponent as PlayButton} from '../theme/svg/play_arrow_black_24dp.svg';
import {ReactComponent as StopButton} from '../theme/svg/stop_black_24dp.svg';

const VideoControl = (props) => {
    if (props.play) {
        return (
            <StopButton className="controls-stop" onClick={(e) => props.handleClick(e)}/>
        )
    } else {
        return (
            <PlayButton className="controls-play" onClick={(e) => props.handleClick(e)}/>
        )
    }
}

const IdText = function(props) {
    if (!props.mode) return null;
    if (props.mode === "road") {
        const geojson = JSON.parse(props.geojson)
        const coordinates = geojson.coordinates
        return (
            <div className='sidetext'>
                <div>
                    <b>{props.geometry.options.label}</b><br></br>
                    <b>{"Road ID: "}</b> {props.geometry.options.roadid} <br></br>
                    <b>{"Carriage ID: "} </b> {props.cwid}<br></br>
                    <b>{"ERP: "}</b>{props.erp}<br></br><br></br>
                    <b>{"Datetime: "}</b>{`${props.datetime}`}<br></br>
                    
                </div>
                <div>
                    <b>{"LatLng: "}</b>{`${coordinates[1]} ${coordinates[0]}`}<br></br>
                    <b>{"Photo: "}</b>{`${props.photo}.jpg`}<br></br>
                    <b>{"Velocity: "}</b>{`${props.velocity} km/hr`}<br></br>
                    <b>{"PDop: "}</b>{`${props.pdop}`}<br></br>
                    <b>{"Satellites: "}</b>{`${props.satellites}`}<br></br>
                </div>
          </div>
          );
    } else {
        return (<div className='sidetext'>
        <b>{"Road ID: "}</b> {props.roadid} <br></br>
          <b>{"Footpath ID: "} </b> {props.cwid}<br></br>
          <b>{"ERP: "}</b>{props.erp}<br></br>
          </div>);
    }
}

export default class VideoCard extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            show: false,
            mode: null,
            index: 0,
            side: 'L',
            disabled: false,
            play: false,
            // playicon: '../theme/svg/play_arrow_black_24dp.svg',
            // forwardicon: "seekForward64blue.png",
            interval: 500,
            errors: 0,
        }
        this.delegate = props.parent;
        this.photoArray = null;


    }

    // delegate(parent) {
    //     this.delegate = parent;
    // }

    getSide() {
        return this.state.side;
    }

    initialise(videoParameters, geometry) {
        this.setState({show: true});
        this.setState({mode: videoParameters.mode});
        this.photoArray = geometry.options.photos;
        this.geometry = geometry;
        this.amazon = videoParameters.amazon;
        this.setState({index: videoParameters.startingIndex});
        if (videoParameters.direction === 'Both') { //need to handle one way
                this.setState({disabled: false});
            } else {
                this.setState({disabled: true});
            }
            
        const latlng = this.getLatLng(videoParameters.startingIndex);
        this.delegate.setState({carMarker: [latlng]});     
    }

    refresh(photo, photoArray) {
        if (photoArray) this.photoArray = photoArray
        const index = this.photoArray.findIndex((element) => element.photo === photo.photo) 
        if (index === -1) {
            alert("error - photo not found");
            return;
        }
        this.setState({index: index});
        let latlng = this.getLatLng(index);
        this.delegate.setState({carMarker: [latlng]});
    }
        
    clickPlay = (e) => {
        e.preventDefault();
        if (this.state.play) {
            this.setState({play: false});
            this.stopMovie();
        } else {
            this.setState({play: true}); 
            //this.setState({playicon: "pause_128.png"});
            this.interval = setInterval(() => {
                if (this.state.index + 1 < this.photoArray.length) {
                    this.update(this.state.index + 1);
                } else {
                    this.stopMovie()
                }           
            }, this.state.interval);  
        }
           
    }

    stopMovie() {
        clearInterval(this.interval);  
        this.setState({play: false});      
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


      
    clickClose(e) {
        e.preventDefault();
        this.reset();
        this.setState({show: false}); 
    }

    reset() {
        this.photoArray = null;
        
        clearInterval(this.interval); 
        //this.setState({playicon: "play_128.png"}); 
        this.setState({playicon: '../theme/svg/play_arrow_black_24dp.svg'});
        this.setState({index: 0});
        this.setState({errors: 0});
        this.setState({side: 'L'}); 
        this.delegate.changeVideoPlayerOpen(false); 
        this.geometry.setStyle({
            color: 'blue'
        })
    }

    changeRadio(e) {
        if (!this.state.play) { 
            // this.setState({playicon: "play_128.png"});
            this.setState({playicon: '../theme/svg/play_arrow_black_24dp.svg'});
        }
        this.delegate.changeSide(this.photoArray[this.state.index], this.state.side);
        this.setState({side: e});
    }

    imageError(err) {
        if (this.photoArray.length === 0 || this.state.errors >= 10) {
            alert("Photos not Found")
            this.reset();
            this.setState({show: false})
            return
        }   
        if (this.state.index >= this.photoArray.length) {alert("Photos not Found")

            this.reset();
            this.setState({show: false})
            return
        } 
        if (this.state.index < this.photoArray.length / 2) {
            this.setState({index: this.state.index + 1})
            this.setState({errors: this.state.errors + 1})
        } else {
            this.setState({index: this.state.index - 1})
            this.setState({errors: this.state.errors + 1})
        }
        
    }

    render() {
        const radios = [
            { name: 'Left', value: 'L' },
            { name: 'Right', value: 'R' },
          ];    
        if (this.state.show) {
            if (!this.photoArray) return null;
            return (
                <Card 
                  className="videoModal"
                >
                <Card.Body className="videoBody">	 
                  <div>
                    <img
                      className="video" 
                      alt="fault"
                      src={this.amazon + this.photoArray[this.state.index].photo + ".jpg"} 
                      onError={(e) => this.imageError(e)}
                        >
                    </img>     
                  </div>
                  <ProgressBar 
                    className="videoProgress" 
                    min={0} 
                    max={this.photoArray.length} 
                    now={this.state.index} 
                    />
                    <div className="controls">
                        <IdText
                            className="controls-text"
                            geometry={this.geometry}
                            mode={this.state.mode}
                            roadid={this.geometry.options.roadid}
                            label={this.geometry.options.label}
                            cwid={this.photoArray[this.state.index].cwid}
                            erp={this.photoArray[this.state.index].erp}
                            velocity={this.photoArray[this.state.index].velocity}
                            datetime={this.photoArray[this.state.index].datetime}
                            inspector={this.photoArray[this.state.index].inspector}
                            pdop={this.photoArray[this.state.index].pdop}
                            photo={this.photoArray[this.state.index].photo}
                            satellites={this.photoArray[this.state.index].satellites}
                            geojson={this.photoArray[this.state.index].st_asgeojson}
                        ></IdText>
                        {/* <div className="controls-play" >
                            <div>
                                <img   
                                    src={this.state.playicon} 
                                    alt="play button"
                                    onClick={(e) => this.clickPlay(e)}
                                />  
                            </div>   
                        </div> */}
                        <VideoControl play={this.state.play} handleClick={this.clickPlay}/>
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