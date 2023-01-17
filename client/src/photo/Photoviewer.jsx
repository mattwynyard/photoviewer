import { useCallback } from 'react';
import { React, useState, useEffect} from 'react';
import {Modal, Button}  from 'react-bootstrap';
import "./PhotoModal.css";

export default function Photoviewer(props) {

    const [show, setShow] = useState(props.show);
    const [url, setUrl] = useState({});
    const [marker, setMarker] = useState([]);
    const [timestamp, setTimestamp] = useState({})


    useEffect(() => {
    }, []);

    const handleChange = (value) => {
    }

    const imageError = (e) => {
      if (this.state.command === "next") {
        const photo = this.getPhoto("next");
        this.setState({photo: photo});
        this.setState({command: "next"});
      } else {
        const photo = this.getPhoto("prev");
        this.setState({photo: photo});
        this.setState({command: "prev"});
      }
    }

    const clickPrev = (e) => {
        e.preventDefault();
        const photo = this.getPhoto("prev");
      }
          
    const clickNext = (e) => {
        e.preventDefault();
        const photo = this.getPhoto("next");
      };

    const DataRow = (props) => {
        return (
            <div>
            {props.data ? <div><b>{props.name}</b>{props.data}{props.symbol}</div>: null}
            </div>
        );
    }

    const DataColumn = (props) => {
        return (
            <div>
            {props.data.map((field, index) => 
              <DataRow key={index.toString()} name={field.name} data={field.data} symbol={field.symbol}></DataRow>    
            )}
            </div>
        );
      }

    const copyToClipboard = (e, latlng) => {
        e.preventDefault();
        const position = latlng.lat + " " + latlng.lng
        navigator.clipboard.writeText(position);
      }

    // const handleClose = useCallback(() => {
    //     setShow(false);
    // })

    const CustomTable = (props) => {
        if(props.obj.type === "road") {
          return (
            <div className="col-md-8"  >
                  <DataColumn data={[
                    {name: "Fault ID: ", data: props.obj.id},
                    {name: "Priority: ", data: props.obj.priority},
                    {name: "Road ID: ", data: props.obj.roadid},
                    {name: "Carriage ID: ", data: props.obj.carriage},
                    {name: "Location: ", data: props.obj.location},
                    {name: "Fault: ", data: props.obj.fault},
                    {name: "Repair: ", data: props.obj.repair},
                    {name: "Width: ", data: props.obj.width, symbol: " m"},
                    {name: "Length: ", data: props.obj.length, symbol: " m"},
                    {name: "Count: ", data: props.obj.count},
                    {name: "Start ERP: ", data: props.obj.starterp},
                    {name: "End ERP: ", data: props.obj.enderp} 
                    ]}>
                  </DataColumn>  
                  <div>
                  <b>{"Date: "}</b>{this.state.date}<br></br>
                  <b>{"Time: "}</b>{this.state.time}<br></br>
                  <b>{"Lat: "}</b>{this.state.marker[0].latlng.lat}<br></br>
                    <b>{"Lng: "}</b>{this.state.marker[0].latlng.lng + "  "}<br></br>
                  <Button variant="outline-secondary" 
                    size="sm" 
                    onClick={this.copy} 
                    >Copy
                  </Button> 
                  </div>     
              </div>
          );
        } else if(props.obj.type === "footpath") {      
          return (
            <div className="col-md-8" >
              <DataColumn data={[
                {name: "Fault ID: ", data: props.obj.id},
                {name: "Grade: ", data: props.obj.grade},
                {name: "Road ID: ", data: props.obj.roadid},
                {name: "Footpath ID: ", data: props.obj.footpathid},
                {name: "Location: ", data: props.obj.roadname},
                {name: "Fault: ", data: props.obj.fault},
                {name: "Cause: ", data: props.obj.cause},
                {name: "Width: ", data: props.obj.width, symbol: " m"},
                {name: "Length: ", data: props.obj.length, symbol: " m"},
                {name: "Count: ", data: props.obj.count},
                {name: "Start ERP: ", data: props.obj.starterp},
                {name: "End ERP: ", data: props.obj.enderp},
                ]}>
              </DataColumn>   
              <div>
                <b>{"Date: "}</b>{this.state.date}<br></br>
                <b>{"Time: "}</b>{this.state.time}<br></br>
                <b>{"Lat: "}</b>{this.state.marker[0].latlng.lat}<br></br>
                  <b>{"Lng: "}</b>{this.state.marker[0].latlng.lng + "  "}<br></br>
                <Button variant="outline-secondary" 
                  size="sm" 
                  onClick={this.copy} 
                  >Copy
                </Button>  
              </div>	 
            </div> 
          );     
        } else {
          return (
            null
          );
        }     
      }


    return (
        <Modal dialogClassName={"photoModal"} 
        show={show} 
        size='xl' 
        centered={true}
        //onHide={() => setShow(false)}
    >
      <Modal.Body >	
        <div>
          <img className="photo"    
            alt="photo"
            src={url.amazon + url.photo + ".jpg"} 
            onError={(e) => imageError(e)}
            />  
          <div className="dataTable">   
          {/* <CustomTable 
            obj={marker[0]}
            copy={(e) => copyToClipboard(e, marker[0].latlng)}>      
          </CustomTable> */}
        </div > 
          <img 
            className="leftArrow" 
            src={"leftArrow_128.png"} 
            alt="left arrow"
            onClick={clickPrev}/> 
          <img 
            className="rightArrow" 
            src={"rightArrow_128.png"} 
            alt="right arrow"
            onClick={clickNext}/>         
      </div>
      </Modal.Body >
  </Modal>
    );
}