import { React} from 'react';
import {Modal, Button}  from 'react-bootstrap';


export default function Modals(props) {
  if (props.id === 'terms') {
    return (
      <Modal 
        className="termsModal" 
        show={props.show} 
        size={'md'} 
        centered={true}
       
        >
        <Modal.Header>
          <Modal.Title><h2>Road Inspection Viewer</h2></Modal.Title>
        </Modal.Header>
        {/* <Modal.Body >	
          <span>{"By using this software you confirm you have read and agreed to the Onsite Developments Ltd."}<a href={"https://osmium.nz/?#terms"}>{"Click for terms of use."}</a><br></br>
            {"All data on this site from Land Information New Zealand is made available under a Creative Commons Attribution Licence."}<br></br>
            {"2019 Onsite Developments Ltd. All rights reserved."}</span><br></br>
		    </Modal.Body> */}
        <Modal.Footer>
          <Button 
            variant="primary" 
            type="submit" 
            id={props.id}
            onClick={(e) => props.onClick(e)}>
              Close
          </Button>
        </Modal.Footer>
      </Modal>
    )
  } else {
    return (
      <Modal 
          className="aboutModal" 
          show={props.show} 
          size={'md'} 
          centered={true}
          
      >
      <Modal.Header>
        <Modal.Title><h2>About</h2> </Modal.Title>
      </Modal.Header>
      <Modal.Body >	
        <b>Road Inspection Version 2.5</b><br></br>
        Relased: 23/04/2020<br></br>
        Company: Onsite Developments Ltd.<br></br>
        Software Developer: Matt Wynyard <br></br>
        <img src="logo192.png" alt="React logo"width="24" height="24"/> React<br></br>
        <img src="webgl.png" alt="WebGL logo" width="60" height="24"/> WebGL<br></br>
        <img src="bootstrap.png" alt="Bootstrap logo" width="24" height="24"/> Bootstrap<br></br>
        <img src="leafletlogo.png" alt="Leaflet logo" width="60" height="16"/> Leaflet<br></br>
        <img src="reactbootstrap.png" alt="React-Bootstrap logo" width="24" height="24"/> React-bootstrap<br></br>
        React-leaflet<br></br>
      </Modal.Body>
      <Modal.Footer>
        <Button 
          variant="primary" 
          size='sm' 
          type="submit" 
          id={props.id}
          onClick={(e) => props.onClick(e)}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
    )
  }   
}