import React from 'react';
import './Data.css';
import 'antd/dist/antd.css';
import { Table } from 'antd';

export default class Data extends React.Component {

    constructor(props) {
        super(props);
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
                dataIndex: 'location',
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
              title: 'Side',
              dataIndex: 'side',
              key: 'side',
            },
            {
              title: 'ERP',
              dataIndex: 'erp',
              key: 'erp',
            },
            {
              title: 'Type',
              dataIndex: 'fpsurface',
              key: 'fpsurface',
            },
            {
                title: 'Fault',
                dataIndex: 'fault',
                key: 'fault',
              },
              {
                title: 'Cause',
                dataIndex: 'cause',
                key: 'cause',
              },
              {
                title: 'Size',
                dataIndex: 'size',
                key: 'size',
              },
              {
                title: 'Length',
                dataIndex: 'length',
                key: 'length',
              },
              {
                title: 'Width',
                dataIndex: 'width',
                key: 'width',
              },
            {
                title: 'Grade',
                dataIndex: 'grade',
                key: 'grade',
              },
          ];


        return(<Table 
          dataSource={this.state.data} 
          align={'center'}
          columns={columns} />);
    }
            
}