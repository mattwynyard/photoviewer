import { CodepenOutlined, TrophyFilled } from '@ant-design/icons';
import React, { Component } from 'react';
import {Dropdown}  from 'react-bootstrap';

export default class Roadlines extends Component {

    constructor(props) {
        super(props);
        this.state = {
            project: null,
            login: null,
            host: null,
            menu: ["Pavement", "Owner", "Hierarchy", "Zone"],
            filter: [],
            data: null

        }
    }

    setProject(project) {
      this.setState({project: project.layer});
      this.setState({login: project.login});
      this.setState({host: project.host});
      this.setState({token: project.token});
    }

    setDelegate(delegate) {
      this.delegate = delegate;
    }
    

    async loadCentrelines(project) {
      //if (this.state.login !== "Login") {
        await fetch('https://' + this.state.host + '/centrelines', {
          method: 'POST',
          headers: {
            "authorization": this.state.token,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user: this.state.login,
            project: project
          })
        }).then(async (response) => {
          const body = await response.json();
          if (body.error != null) {
            alert(`Error: ${body.error}\n`);
          } else {
            if (body.data) {
              this.setState({data: body.data});
            }
          }   
        })
        .catch((error) => {
          console.log("error: " + error);
          alert(error);
          return;
        });
      }

   clickCheck = (e, value) => {
     if (this.isChecked(value)) {
      this.setState({filter: []});
      this.delegate.glData.centre = [];
      let glData = this.delegate.glData;
      this.delegate.redraw(glData, false);
     } else {
      this.setState(
        {filter: [value]},
        () => {
          let options = {type: "centreline", value: value}
          let centrelines = this.delegate.loadLines([], this.state.data, options);
          let glData = this.delegate.glData;
          glData.centre = centrelines.vertices;
          this.delegate.redraw(glData, false);
        });
     }
      
    }

    changeCheck = (value) => {
    }

    isChecked = (value) => {
      if (this.state.filter.includes(value)) {
        return true;
      } else {
        return false;
      }
      
    }

    render() {
      if (this.state.project) {
        return (
          <Dropdown className="centreline">
          <Dropdown.Toggle variant="light" size="sm" >
              Centrelines
            </Dropdown.Toggle>
            <Dropdown.Menu className="custommenu">
              {this.state.menu.map((value, index) =>
              <div key={`${index}`}>
              <input
                key={`${index}`} 
                id={value} 
                type="checkbox" 
                checked={this.isChecked(value)}
                onClick={(e) => this.clickCheck(e, value)}
                onChange={(e) => this.changeCheck(value)}
                >
              </input>{" " + value}<br></br>
            </div> 
            )}
          </Dropdown.Menu>
        </Dropdown> 
        );
      } else {
        return null;
      }
    }
  }
