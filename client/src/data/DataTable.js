import React from 'react';
import './DataTable.css';
import { Table} from 'react-bootstrap';


export default class DataTable extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
          selectedIndex: null
        }
        this.rdheader = ["#", "Id", "Inspection", "Location", "RoadId", "CarriageId", "Start", "End", "Side", "Fault", "Repair", "Priority",
        "Length", "Width", "Count", "DateTime"];  
        this.fpheader = ["#", "Id", "Location", "RoadId", "FootpathId", "Start", "End", "Side", "Asset", "Surface", "Fault", "Cause", "Grade",
        "Length", "Width", "DateTime"];     
    }

    handleClick = (value, index) => {
      this.props.centre(value.latlng.lat, value.latlng.lng, 16);
      this.props.simulate(index + 1)
    }

    render() {
      if (this.props.className === "data-inactive" ) {
        return null;
      } else {
        if (this.props.surface === "road") {
          return(
            <div className={this.props.className}>
              <Table responsive='sm' striped bordered hover size="sm">
                <thead>
                  <tr>
                    {this.rdheader.map((value, index) => (
                      <th key={index}>{value}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                {this.props.data.map((value, index) => (
                  <tr 
                    key={`index-${index}`}
                    onClick={() => this.handleClick(value, index)}
                  >
                    <td key={`${value.id}-0`}>{index + 1}</td>
                    <td key={`${value.id}-1`}>{value.id}</td>
                    <td key={`${value.id}-2`}>{value.inspection}</td>
                    <td key={`${value.id}-3`}>{value.location}</td>
                    <td key={`${value.id}-4`}>{value.roadid}</td>
                    <td key={`${value.id}-5`}>{value.carriage}</td>
                    <td key={`${value.id}-6`}>{value.starterp}</td>
                    <td key={`${value.id}-7`}>{value.enderp}</td>
                    <td key={`${value.id}-8`}>{value.side}</td>
                    <td key={`${value.id}-9`}>{value.fault}</td>
                    <td key={`${value.id}-10`}>{value.repair}</td>
                    <td key={`${value.id}-11`}>{value.priority}</td>
                    <td key={`${value.id}-12`}>{value.length}</td>
                    <td key={`${value.id}-13`}>{value.width}</td>
                    <td key={`${value.id}-14`}>{value.count}</td>
                    <td key={`${value.id}-15`}>{value.datetime}</td>
                  </tr>
                ))}
                
                </tbody>
              </Table>    
            </div>  
          );
        } else {
          return(
            <div className={this.props.className}>
              <Table responsive='sm' striped bordered hover size="sm">
                <thead>
                  <tr>
                    {this.fpheader.map((value, index) => (
                      <th key={index}>{value}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                {this.props.data.map((value, index) => (
                  <tr 
                    key={`index-${index}`}
                    onClick={() => this.handleClick(value, index)}
                  >
                    <td key={`${value.id}-0`}>{index + 1}</td>
                    <td key={`${value.id}-1`}>{value.id}</td>
                    <td key={`${value.id}-2`}>{value.location}</td>
                    <td key={`${value.id}-4`}>{value.roadid}</td>
                    <td key={`${value.id}-5`}>{value.footpathid}</td>
                    <td key={`${value.id}-6`}>{value.starterp}</td>
                    <td key={`${value.id}-7`}>{value.enderp}</td>
                    <td key={`${value.id}-8`}>{value.side}</td>
                    <td key={`${value.id}-9`}>{value.asset}</td>
                    <td key={`${value.id}-10`}>{value.fpsurface}</td>
                    <td key={`${value.id}-11`}>{value.fault}</td>
                    <td key={`${value.id}-12`}>{value.cause}</td>
                    <td key={`${value.id}-13`}>{value.grade}</td>
                    <td key={`${value.id}-14`}>{value.length}</td>
                    <td key={`${value.id}-15`}>{value.width}</td>
                    <td key={`${value.id}-16`}>{value.datetime}</td>
                  </tr>
                ))}
                
                </tbody>
              </Table>    
            </div>  
          );
        }
      }
    }            
}