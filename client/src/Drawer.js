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
            mode: 'map',
        }
    }

  showDrawer = () => {
    this.setState({visible: true});
  };

  onClose = () => {
    this.setState({visible: false});
  };

  setMode = (mode) => {
      console.log(mode);
    this.setState({mode: mode});
  }

  render() {
    return (
        <>
            <Button 
                className="button" 
                type="light" 
                onClick={this.showDrawer}>{this.state.mode}
                {/* <Row type="flex" align="middle">
                    <Col>
                        <div style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center'}}>
                        <GlobalOutlined
                    style={{fontSize: '25px'}} 
                    />
                        </div>
                    </Col>
                </Row>   */}
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
                    className="video-btn"
                    block={true}
                    id="video"
                    disabled={(this.state.mode==="map")}
                    onClick={(e) => this.setMode("map")}>
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
                    disabled={(this.state.mode==="video")}
                    onClick={(e) => this.setMode("video")}>
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