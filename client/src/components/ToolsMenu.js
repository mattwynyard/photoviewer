import React, {useState, useEffect} from "react";
import ToggleButton from "react-bootstrap/ToggleButton";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import './ToolsMenu.css'

export default function ToolsMenu(props) {

  const [radioValue, setRadioValue] = useState(props.mode);


  useEffect(() => {
    props.parent.clickToolsRadio(radioValue);
  }, [radioValue, props.parent]);

  const radios = [
    { name: "Video Mode", value: "video" },
    { name: "Street Mode", value: "street" },
    { name: "Ruler", value: "ruler" }
  ];
  
  return (
    <>
      <ButtonGroup toggle vertical size='sm' className='toolsmenu'>
        {radios.map((radio, index) => (
          <ToggleButton 
            className='toolsbutton'
            key={index}
            type="radio"
            name="radio"
            variant="light"
            value={radio.value}
            checked={radioValue === radio.value}
            onChange={e => setRadioValue(e.currentTarget.value)}
          >
            {radio.name}
          </ToggleButton>
          
        ))}
        
      </ButtonGroup>
    </>
  );
}