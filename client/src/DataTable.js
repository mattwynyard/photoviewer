import React from 'react';
//import './App.css';
import './DataTable.css';
import { Table } from 'react-bootstrap';


export default class DataTable extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            data: props.data,
            className: props.className,
            selectedIndex: -1
        }
        this.header = ["#", "Id", "Inspection", "Location", "RoadId", "CarriageId", "Start", "End", "Side", "Fault", "Repair", "Priority",
        "Length", "Width", "Count", "DateTime", "Photo"];       
    }

    onClick = (value) => {
      console.log(value)
      this.props.centre(value.latlng.lat, value.latlng.lng, 18)
    }

    render() {
      if (this.props.data.length === 0) {
        return null;
      } else {
        return(
          <div className={this.props.className}>
            <Table responsive='sm' striped bordered hover size="sm">
            <thead>
            <tr>
              {this.header.map((value, index) => (
                <th key={index}>{value}</th>
              ))}
            </tr>
            </thead>
            <tbody>
              {this.props.data.map((value, index) => (
                <tr
                  key={`index-${index}`}
                  onClick={(e) => this.onClick(value)}
                >
                  <td key={`${value.id}-0`}>{value.seq}</td>
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
                  <td key={`${value.id}-16`}>{value.photo}</td>
                </tr>
              ))}
            </tbody>
          </Table>
          </div>      
        );
      }
    }            
}