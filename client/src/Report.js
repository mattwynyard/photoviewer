import React from 'react';
import './Report.css';
import './CustomNav.js';
import { Link } from "react-router-dom";
import {Navbar, Nav}  from 'react-bootstrap';
import CustomNav from './CustomNav.js';
import Chart from 'chart.js';

class Report extends React.Component {

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

    componentDidMount() {
        this.gradeMap = new Map();
        this.faultMap = new Map();
        this.g1Map = new Map();
        this.g2Map = new Map();
        this.g3Map = new Map();
        this.data.forEach(item => {

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
                case  "Priority: 2":
                    this.g2Map = this.addMap(this.g3Map, item.fault);
                case  "Priority: 3":
                    this.g3Map = this.addMap(this.g3Map, item.fault);
            }
            this.gradeMap = this.addMap(this.gradeMap, item.priority);
            this.faultMap = this.addMap(this.faultMap, item.class);

        });
        let gradeData = Array.from(this.gradeMap, ([name, value]) => ({ name, value }));
        let faultData = Array.from(this.faultMap, ([name, value]) => ({ name, value }));
        let g1Data = Array.from(this.g1Map, ([name, value]) => ({ name, value }));
        
        gradeData.sort((a, b) => (a.value < b.value) ? 1 : -1);
        faultData.sort((a, b) => (a.value < b.value) ? 1 : -1);
        g1Data.sort((a, b) => (a.value < b.value) ? 1 : -1);
        let g1Top = g1Data.slice(0, 5);
        let g1Bottom = g1Data.slice(5, g1Data.length);

        let value = 0;
        g1Bottom.forEach(item => {
            value += item.value;
        });
        let others = {name: "Others", value};
        g1Top.push(others);
        console.log(g1Top);
        var ctx = document.getElementById('myChart').getContext("2d");
        let ct = this.buildColorTable(g1Top.length);
        var gradeChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: gradeData.map((gradeData) => gradeData.name),
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
                
                scales: {
                    yAxes: [{
                        ticks: {
                            display: false
                        }
                        
                    }]
                },
                maintainAspectRatio: false,
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 12
                    }
                }
            }
        });

        var ctx = document.getElementById("class").getContext('2d');

            var g1Chart = new Chart(ctx, {
                type: 'doughnut',
            data: {
                labels: g1Top.map((g1Top) => g1Top.name),
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
                scales: {
                    yAxes: [{
                        ticks: {
                            display: false
                        }
                        
                    }]
                },
                maintainAspectRatio: false,
                legend: {
                    position: 'bottom',
                    labels: {
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
            
            <div className="faultChart">
            <canvas id="class"></canvas>  
            </div>
            <div className="priorityChart">
            <canvas id="myChart"></canvas>  
            </div>
      </div> 
    );
    }
}
export default Report;
  
