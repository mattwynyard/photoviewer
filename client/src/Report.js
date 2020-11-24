import React from 'react';
import './Report.css';
import './CustomNav.js';
import { Link } from "react-router-dom";
import {Navbar, Nav}  from 'react-bootstrap';
import CustomNav from './CustomNav.js';
import Chart from 'chart.js';

class Report extends React.Component {

    constructor(props) {
        super(props);
        //console.log(props.location);
        this.state = {
            mode: props.mode,
        }
    }

    addMap(map, data) {
        if (map.has(data)) {
            let n = map.get(data);
            n = n + 1;
            map.set(data, n); 
        } else {
            if (data !== 0) {
                map.set(data, 1); 
            }   
        }
        return map;
    }

    buildColorTable(count) {
        return [
            'rgba(255, 159, 64, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',          
        ];
    }

    clickChart(e) {
        //console.log(e.target);
        console.log(this.gradeChart.getElementsAtEvent(e));
    }

    componentDidMount() {
        this.gradeMap = new Map();
        this.faultMap = new Map();
        this.g1Map = new Map();
        this.g2Map = new Map();
        this.g3Map = new Map();
        
        this.data.forEach(item => {
            
            if(item.type === "footpath") {
                console.log(item);
                switch(item.grade) {
                    case  "Grade: 5":
                        this.g1Map = this.addMap(this.g1Map, item.fault);
                        break;
                    case  "Grade: 4":
                        this.g2Map = this.addMap(this.g2Map, item.fault);
                        break;
                    case  "Grade: 3":
                        this.g3Map = this.addMap(this.g3Map, item.fault);
                        break;
                    default:
                        break;
    
                }
            this.gradeMap = this.addMap(this.gradeMap, item.grade);
            this.faultMap = this.addMap(this.faultMap, item.fault);
            } else {
                if (item.priority !== 0 ) {
                    if (item.priority === 99) {
                        item.priority = "Signage";
                    } else {
                        item.priority = "Priority: " + item.priority;
                    }
                }
                switch(item.priority) {
                    case  "Priority: 1":
                        this.g1Map = this.addMap(this.g1Map, item.fault);
                        break;
                    case  "Priority: 2":
                        this.g2Map = this.addMap(this.g2Map, item.fault);
                        break;
                    case  "Priority: 3":
                        this.g3Map = this.addMap(this.g3Map, item.fault);
                        break;
                    default:
                        break;
    
                }
            this.gradeMap = this.addMap(this.gradeMap, item.priority);
            this.faultMap = this.addMap(this.faultMap, item.class);
            }
            
            
        });
        let gradeData = Array.from(this.gradeMap, ([name, value]) => ({ name, value }));
        let faultData = Array.from(this.faultMap, ([name, value]) => ({ name, value }));
        let g1Data = Array.from(this.g1Map, ([name, value]) => ({ name, value }));
        let g2Data = Array.from(this.g2Map, ([name, value]) => ({ name, value }));
        let g3Data = Array.from(this.g3Map, ([name, value]) => ({ name, value }));
        gradeData.sort((a, b) => (a.value < b.value) ? 1 : -1);
        faultData.sort((a, b) => (a.value < b.value) ? 1 : -1);
        g1Data.sort((a, b) => (a.value < b.value) ? 1 : -1);
        g2Data.sort((a, b) => (a.value < b.value) ? 1 : -1);
        g3Data.sort((a, b) => (a.value < b.value) ? 1 : -1);
        let g1Top = g1Data.slice(0, 5);
        let g1Bottom = g1Data.slice(5, g1Data.length);
        let g2Top = g2Data.slice(0, 5);
        let g2Bottom = g2Data.slice(5, g2Data.length);
        let g3Top = g3Data.slice(0, 5);
        let g3Bottom = g3Data.slice(5, g3Data.length);
        let value1 = 0;
        let value2 = 0;
        let value3 = 0;
        g1Bottom.forEach(item => {
            value1 += item.value;
        });
        g2Bottom.forEach(item => {
            value2 += item.value;
        });
        g3Bottom.forEach(item => {
            value3 += item.value;
        });
        let others1 = {name: "Others", value: value1};
        let others2 = {name: "Others", value: value2};
        let others3 = {name: "Others", value: value3};
        g1Top.push(others1);
        g2Top.push(others2);
        g3Top.push(others3);
       
        var ctx = document.getElementById('myChart').getContext("2d");
        let ct = this.buildColorTable(g1Top.length);
        this.gradeChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: gradeData.map((gradeData) => gradeData.name + ": " + gradeData.value),
                datasets: [{
                    data: gradeData.map((gradeData) => gradeData.value),
                    backgroundColor: [
                        'rgba(0, 204, 0, 1)',
                        'rgba(255, 128, 0, 1)',
                        'rgba(255, 0, 255, 1)',
                        'rgba(0, 0, 255, 1)',
                    ],
                    borderColor: [
                        'rgba(0, 204, 0, 1)',
                        'rgba(255, 128, 0, 1)',
                        'rgba(255, 0, 255, 1)',
                        'rgba(0, 0, 255, 1)',    
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                onClick: (e) => {
                    this.clickChart(e);
                },
                maintainAspectRatio: false,
                legend: {
                    position: 'right',

                    labels: {
                        padding: 10,
                        boxWidth: 12
                    }
                }
            }
        });

        var ctx = document.getElementById("grade1").getContext('2d');
        var g1Chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: g1Top.map((g1Top) => g1Top.name + ": " + g1Top.value),
                datasets: [{
                    data: g1Top.map((g1Top) => g1Top.value),
                    backgroundColor: [
                        'rgba(255, 159, 64, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 99, 132, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',                  
                    ],
                    borderColor: [
                        'rgba(255, 159, 64, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 99, 132, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',                 
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                title: {
                    display: true,
                    position: 'top',
                    text: 'Priority 1',
                },
                maintainAspectRatio: false,
                legend: {
                    position: 'right',
                    fullWidth: false,
                    labels: {
                        padding: 10,
                        boxWidth: 12
                    }
                }
            }
        });

        var ctx = document.getElementById("grade2").getContext('2d');
        var g2Chart = new Chart(ctx, {
            type: 'doughnut',
        data: {
            labels: g2Top.map((g2Top) => g2Top.name + ": " + g2Top.value),
            datasets: [{
                data: g2Top.map((g2Top) => g2Top.value),
                backgroundColor: [
                    'rgba(255, 159, 64, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',             
                ],
                borderColor: [
                    'rgba(255, 159, 64, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',                   
                ],
                borderWidth: 1
            }]
        },
        options: {
            title: {
                display: true,
                text: 'Priority 2',
            },
            maintainAspectRatio: false,
            legend: {
                position: 'right',
                labels: {
                    padding: 10,
                    boxWidth: 12
                }
            }
        }
        });

        var ctx = document.getElementById("grade3").getContext('2d');
            var g3Chart = new Chart(ctx, {
                type: 'doughnut',
            data: {
                labels: g3Top.map((g3Top) => g3Top.name + ": " + g3Top.value),
                datasets: [{
                    data: g3Top.map((g3Top) => g3Top.value),
                    backgroundColor: [
                        'rgba(255, 159, 64, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 99, 132, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',            
                    ],
                    borderColor: [
                        'rgba(255, 159, 64, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 99, 132, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',                     
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                title: {
                    display: true,
                    text: 'Priority 3',
                    padding: 5,
                },
                maintainAspectRatio: false,
                responsive: true,
                legend: {
                    position: 'right',
                    labels: {
                        padding: 10,
                        boxWidth: 12
                    }
                }
            }
            });
    }
    render() {
        const { login } = this.props.location
        const { user } = this.props.location
        const { data } = this.props.location
        this.user = user;
        this.login = login;
        this.data = data;
        
    return (
        <div> 
            <Navbar bg="light" expand="lg"> 
        
          <Navbar.Brand href="#home">
          <img
              src="logo.png"
              width="122"
              height="58"
              className="d-inline-block align-top"
              alt="logo"
            />
          </Navbar.Brand>
          <Nav> 
            <Link className="dropdownlink" to={'/'} style={{ textDecoration: 'none' }}>Home</Link>
            </Nav>
            <CustomNav title={this.user}></CustomNav>
            </Navbar>
            
            <div className="chartParent">
                <div className = "g1div">
                    <canvas className="g1Chart" id="grade1"></canvas>  
                </div>
                <div className = "g2div">
                    <canvas className="g2Chart" id="grade2"></canvas>  
                </div>
                <div className = "g3div">
                    <canvas className="g3Chart" id="grade3"></canvas>  
                </div>
                <div className = "gradediv">
                    <canvas className="gradeChart" id="myChart"></canvas>  
                </div>
            </div>    
      </div> 
    );
    }
}
export default Report;
  
