import React from 'react';
import 'antd/dist/antd.css';
import './Drawer.css';
import { Row, Col,  Drawer, Button, Space } from 'antd';
import { GlobalOutlined, VideoCameraAddOutlined } from '@ant-design/icons';

export default class AntDrawer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            visible: false,
            mode: 'Map',
            video: false
        }
    }

  showDrawer = () => {
    this.setState({visible: true});
  };

  onClose = () => {
    this.setState({visible: false});
  };

  setMode = (mode) => {
      //console.log(mode);
    this.setState({mode: mode});
  }

  setVideo(hasVideo) {
    this.setState({video: hasVideo});
  }

  getMode() {
    return this.state.mode;
  }

  render() {
    return (
        <>
            <Button 
                className="button" 
                type="light" 
                onClick={this.showDrawer}
                disabled={this.state.disabled}
                >
                {this.state.mode}
            </Button>
            <Drawer
                className="drawer"
                title="Tools"
                placement="left"
                closable={true}
                onClose={this.onClose}
                visible={this.state.visible}
                width={220}
            >
            <Space direction="vertical">
                <Button 
                    className="map-btn"
                    block={true}
                    disabled={(this.state.mode==="Map")}
                    onClick={(e) => this.setMode("Map")}>
                    <div>
                    <Row>
                        <Col span={6}> 
                            <GlobalOutlined style={{ fontSize: '20px'}}/>
                        </Col>
                        <Col span={16}>
                            <b>Map Mode</b>
                        </Col>
                    </Row>
                </div>
                </Button>
                <Button 
                    className="video-btn"
                    block={true}
                    disabled={(this.state.mode==="Video") || (this.state.video===false)}
                    //disabled={true}
                    onClick={(e) => this.setMode("Video")}>
                    <div>
                    <Row>
                        <Col span={6}> 
                            <VideoCameraAddOutlined style={{ fontSize: '20px'}}/>
                        </Col>
                        <Col span={16}>
                            <b>Video Mode</b>
                        </Col>
                    </Row>
                </div>
                </Button>
            </Space>
            </Drawer>
        </>
    );
    }
}