
import React, { useRef, useEffect } from 'react';
import {InputGroup, FormControl, Button}  from 'react-bootstrap';

const SearchBar = (props, ref) => {

    useEffect(() => {
        console.log(ref);
      });
    
    return (
        <div>
            <InputGroup 
            className="search">
            <FormControl 
                className="search"
                id="search"
                placeholder="Search"
                onChange={(e) => this.changeSearch(e)}
            />
            <InputGroup.Append>
                <Button className="searchButton" variant="light">
                <img 
                    className="searchicon" 
                    src="search.png" 
                    alt="magnifying glass" 
                    width="24" 
                    height="24"
                    onClick={(e) => this.clickSearch(e)}>
                </img>
                </Button>
            </InputGroup.Append>
            </InputGroup>
        </div>)
    };
export {SearchBar};
