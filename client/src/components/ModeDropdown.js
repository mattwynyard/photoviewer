import { React} from 'react';
import {Dropdown, DropdownButton}  from 'react-bootstrap';
import './ModeDropdown.css';

export default function ModeDropdown(props) {

    const handleChange = (e) => {
        props.setMode(e.target.value)
    }

    return (
        <DropdownButton 
            className="modeDropdown" 
            drop='end' 
            title={"Mode"}
             variant="light" 
             size="sm"
             disabled={!props.disabled}>
            <Dropdown.Item style={{ margin: 0 }}>
                <div>
                    <input 
                        type="radio" 
                        id="map-btn" 
                        name="mode" 
                        value="map"
                        checked={props.mode === "map"}
                        onChange={(e) => handleChange(e)}
                    />
                    <label 
                        htmlFor="map-btn"
                    >Map
                    </label>
                </div>
                </Dropdown.Item>

                <Dropdown.Item style={{ margin: 0 }}>
                <div>
                    <input 
                        type="radio" 
                        id="video-btn" 
                        name="mode" 
                        value="video"
                        checked={props.mode === "video"}
                        onChange={(e) => handleChange(e)}
                        />
                    <label 
                        htmlFor="video-btn"
                    >Video
                    </label>
                </div>
                </Dropdown.Item>
        </DropdownButton>
    )
}