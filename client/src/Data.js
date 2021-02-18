import React from 'react';
import './Data.css';
import 'antd/dist/antd.css';
import { Table } from 'antd';

export default class Data extends React.Component {

    constructor(props) {
        super(props);
        console.log(props.location.data)
        this.state = {
            data: props.location.data
        }          
    }

    

    componentDidMount() {
    }

    render() {
        const columns = [
            {
              title: 'Id',
              dataIndex: 'id',
              key: 'id',
            },
            {
                title: 'Road Name',
                dataIndex: 'roadname',
                key: 'roadname',
            },
            {
              title: 'Road ID',
              dataIndex: 'roadid',
              key: 'roadid',
            },
            {
              title: 'Footpath ID',
              dataIndex: 'footpathid',
              key: 'footpathid',
            },
            {
                title: 'Fault',
                dataIndex: 'fault',
                key: 'fault',
              },
            {
                title: 'Grade',
                dataIndex: 'grade',
                key: 'grade',
              },
          ];


        return(<Table dataSource={this.state.data} columns={columns} />);
    }
            
}