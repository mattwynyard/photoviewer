import React from "react";
import {Modal, Button}  from 'react-bootstrap';
export default class ModalImage extends React.Component {
  
    state = { show: false, modalPhoto: null };

  handleShowDialog = () => {
    this.setState({ isOpen: !this.state.isOpen });
  };

  render() {
    const handleClose = () => this.setState({show: false});
    return (
        
        <Modal show={this.state.show}>
        <Modal.Header>
          <Modal.Title>{this.state.modalPhoto}</Modal.Title>
        </Modal.Header>
        <Modal.Body ></Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }
}