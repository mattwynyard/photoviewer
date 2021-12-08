import React, { Component } from 'react';
import {Form, FormControl, Button}  from 'react-bootstrap';
import './Navigation.css'
import L from 'leaflet';

export default class SearchBar extends Component {

    constructor(props) {
        super(props);
        this.state = {
            serach: null,
        }
    }
      
    clickSearch = async(e) => {
        e.preventDefault();
        if (!this.state.search) return;
        let tokens = null
        tokens = this.state.search.split(" ");
        if(!tokens) return;
        let searchString = "";
        for (let i = 0; i < tokens.length; i++) {
        if (i !== tokens.length - 1) {
            searchString += tokens[i] + "+";
        } else {
            searchString += tokens[i];
        }
        }
        if (this.props.district !== null) {
            searchString += "," + this.props.district
        }
        console.log(searchString)
        const response = await fetch("https://nominatim.openstreetmap.org/search?q=" + searchString + "&countrycodes=nz&format=json&addressdetails=1", {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',        
        },
        });
        const body = await response.json();
        if (response.status !== 200) {
        alert(response.status + " " + response.statusText);  
        throw Error(body.message);    
        } 
        if (body.length !== 0) {
            if (body[0] !== "undefined" || body[0] !== "") {
                let latlng1 = L.latLng(parseFloat(body[0].boundingbox[0]), parseFloat(body[0].boundingbox[2]));
                let latlng2 = L.latLng(parseFloat(body[0].boundingbox[1]), parseFloat(body[0].boundingbox[3]));
                this.props.centre([latlng1, latlng2])
            }
        }
    }

    render() {
        return (
            <Form className="search">
                <FormControl
                    type="search" 
                    id="search-form"
                    placeholder="Search"
                    onChange={(e) => this.setState({search: e.target.value})}
                />
                <Button 
                    variant="light"
                    >
                    <img 
                        src="search.png" 
                        alt="search" 
                        onClick={this.clickSearch}>
                    </img>
                </Button>
            </Form>
        );
    }
}
