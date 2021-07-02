const CustomMenu = (props) => {
    if (typeof props.projects === 'undefined' || props.projects.length === 0) {
        return (  
          null  
          );
    } else {  
      return (        
        <NavDropdown title={props.title} className="navdropdownitem" drop="right">
        {props.projects.map((value, index) =>      
          <NavDropdown.Item className="navdropdownitem"
            key={`${index}`}
            index={index}
            title={value.code}
            code={value.code}
            onClick={props.onClick}>
            {value.description + " " + value.date}
            <NavDropdown.Divider />
          </NavDropdown.Item>
        )}
        </NavDropdown>
        );
    }
  }

