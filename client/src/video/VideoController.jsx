import React from 'react';
import {ProgressBar }  from 'react-bootstrap';
import L from 'leaflet';
import './VideoCard.css';
import { store } from '../state/store'
import { AppContext } from '../context/AppContext';
import {ReactComponent as PlayButton} from '../theme/svg/play_arrow_white_24dp.svg';
import {ReactComponent as StopButton} from '../theme/svg/stop_white_24dp.svg';
import {ReactComponent as FastForward} from '../theme/svg/fast_forward_white_24dp.svg';
import {ReactComponent as FastRewind} from '../theme/svg/fast_rewind_white_24dp.svg';
import {ReactComponent as Cancel} from '../theme/svg/close_24dp.svg';
import {ReactComponent as Download} from '../theme/svg/download_24dp.svg';
import {ReactComponent as ToggleOn} from '../theme/svg/toggle_on_48dp.svg';
import {ReactComponent as ToggleOff} from '../theme/svg/toggle_off_48dp.svg';

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

const SideControl = (props) => {
    if (props.side === 'R') {
        const newSide = 'L'
        return (
            <ToggleOn onClick={(e) => props.handleClick(e, newSide)}/>
        )
    } else if (props.side === 'L') {
        const newSide = 'R'
        return (
            <ToggleOff onClick={(e) => props.handleClick(e, newSide)}/>
        )
    } else {
        return null
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
                    <b>{"Photo: "}</b>{`${props.photo}.jpg`}<br></br><br></br>
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

export default class VideoController extends React.Component {
    static contextType = AppContext;
    constructor(props) {
        super(props);
        this.state = {
            show: false,
            mode: null,
            index: 0,
            side: 'L',
            disabled: false,
            play: false,
            initialised: false,
            errors: 0,
           
        }
        this.delegate = props.parent;
        this.photoArray = null;
        this.index = 0;
        this.geometry = null;
        this.amazon = null;
    }



    getSide() {
        return this.state.side;
    }

    initialise(videoParameters, geometry) {
        this.setState({show: true});
        this.setState({mode: videoParameters.mode});
        this.interval = videoParameters.interval
        this.photoArray = geometry.options.photos;
        this.geometry = geometry;
        this.amazon = videoParameters.amazon;
        this.index = videoParameters.startingIndex;
        if (videoParameters.direction === 'Both') { //need to handle one way
                this.setState({disabled: false});
            } else {
                this.setState({disabled: true});
            }
        this.update(videoParameters.startingIndex)    
    }

    refresh(photo, photoArray) {
        if (photoArray) this.photoArray = photoArray
        const index = this.photoArray.findIndex((element) => element.photo === photo.photo) 
        if (index === - 1) {
            alert("error - photo not found");
            return;
        }
        this.setState({index: index});
        this.index = index;
        let latlng = this.getLatLng(index);
        this.delegate.setState({carMarker: [{position: [latlng], bearing: this.photoArray[index].bearing}]});
       
    }
        
    clickPlay = (e) => {
        e.preventDefault();
        if (this.state.play) {
            this.setState({play: false});
            this.stopMovie();
        } else {
            this.setState({play: true}); 
            this.startTimer(this.interval, false);
        }       
    }

    switchSide = (e, side) => {
        e.preventDefault();
        this.delegate.changeSide(this.photoArray[this.index], this.state.side);
        this.setState({side: side});
    }

    startTimer = (interval, isReverse) => {
        if (isReverse) {
            this.timer = setInterval(() => {
                if (this.index + 1 < this.photoArray.length) {
                    this.update(this.index - 1);
                } else {
                    this.stopMovie()
                }           
            }, interval);
        } else {
            this.timer = setInterval(() => {
                if (this.index + 1 < this.photoArray.length) {
                    this.update(this.index + 1);
                } else {
                    this.stopMovie()
                }           
            }, interval); 
        }
        
    }

    clickFastForward = (e) => {
        e.preventDefault();
        if (this.state.play) {
            clearInterval(this.timer);
            this.startTimer(this.interval * 0.5, false)
        } else {
            this.update(this.index + 1);
        }         
    }

    clickFastRewind = (e) => {
        e.preventDefault();
        if (this.state.play) {
            clearInterval(this.timer);
            this.startTimer(this.interval * 0.5, true)
        } else {
            this.update(this.index - 1); 
        }         
    }

    stopMovie() {
        clearInterval(this.timer);  
        this.setState({play: false});      
    }

    update(index) {
        if (this.index < this.photoArray.length && this.index > 0) {
            this.setState({index: index});
            this.index  = index;
            let latlng = this.getLatLng(index);
            this.props.centre(latlng.lat, latlng.lng, 16);
            this.delegate.setState({carMarker: [{position: [latlng], bearing: this.photoArray[index].bearing}]});
           
        } else {
            console.log("stop timer")
            clearInterval(this.timer)
        }   
    }

    getLatLng(index) {
        if (!this.photoArray[index].st_asgeojson) {
            return
        }
        const geojson = JSON.parse(this.photoArray[index].st_asgeojson);
        const lat = geojson.coordinates[1];
        const lng = geojson.coordinates[0];
        return new L.LatLng(lat, lng);
    }

    clickClose(e) {
        e.preventDefault();
        this.reset();
        this.setState({show: false}); 
        this.setState({play: false}); 
    }

    reset() {
        this.photoArray = null;      
        clearInterval(this.timer); 
        this.setState({index: 0});
        this.setState({errors: 0});
        this.setState({side: 'L'}); 
        this.delegate.changeVideoPlayerOpen(false); 
        this.geometry.setStyle({
            color: 'blue'
        })
        this.delegate.setState({carMarker: []});
    }

    imageError(e) {
        console.log(e)
        if (this.photoArray.length === 0 || this.state.errors >= 10) {
            alert("Photos not Found")
            this.reset();
            this.setState({show: false})
            return
        }   
        if (this.state.index >= this.photoArray.length) {
            alert("Photos not Found")
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

    clickDownload = () => {
        if (store.getState().download.showDownload) return
        if (this.state.play) return
        const downloadRequest = {
            user: this.context.login.user,
            project: this.props.project.code,
            surface: this.props.project.surface,
            cwid: this.photoArray[this.state.index].cwid,
            side: this.state.side,
            tacode: this.props.project.tacode,
            amazon: this.props.project.amazon,
            roadid: this.geometry.options.roadid,
            label: this.geometry.options.label,
        }
        this.props.clickDownload(downloadRequest);
    }



    render() {  
        if (this.state.show) {
            if (!this.photoArray) return null;
            return (
                <>
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
                <div 
                  className="videoModal"
                > 
                    <div className="video" >
                        <img 
                            className="image"
                            src={this.amazon + this.photoArray[this.index].photo + ".jpg"} 
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
                    <div className='container-controls'>
                        <div>
                            <SideControl handleClick={this.switchSide} side={this.state.side}/>
                        </div>                     
                        <div className = "controls-video">
                            <FastRewind className="controls-fastrewind" onClick={this.clickFastRewind}/>
                            <VideoControl handleClick={this.clickPlay} play={this.state.play} />
                            <FastForward className="controls-fastforward" onClick={this.clickFastForward}/>
                        </div>
                        <div className = "controls-action">
                            <Download className="controls-download" onClick={this.clickDownload}/>
                            <Cancel className="controls-close" onClick={(e) => this.clickClose(e)}/>
                        </div>
                        
                    </div>    
                </div>    
              </>
              );
        } else {
            return (
                null
            );          
        }
      
  }
}

