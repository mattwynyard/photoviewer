import React from 'react';
import './Report.css';
import './CustomNav.js';
import { Link } from "react-router-dom";
import {Navbar, Nav}  from 'react-bootstrap';
import CustomNav from './CustomNav.js';
import Chart from 'chart.js'
//import { map } from 'leaflet';

class Report extends React.Component {

    buildMap(map, data) {
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

    componentDidMount() {
        this.gradeMap = new Map();
        this.faultMap = new Map();
        this.data.forEach(item => {

            if (item.priority !== 0 ) {
                if (item.priority === 99) {
                item.priority = "Signage";
                } else {
                    item.priority = "Priority " + ": " + item.priority;
                }
            }
            this.gradeMap = this.buildMap(this.gradeMap, item.priority);
            this.faultMap = this.buildMap(this.faultMap, item.class);

        });
        let gradeData = Array.from(this.gradeMap, ([name, value]) => ({ name, value }));
        let faultData = Array.from(this.faultMap, ([name, value]) => ({ name, value }));
        gradeData.sort((a, b) => (a.value < b.value) ? 1 : -1);
        faultData.sort((a, b) => (a.value < b.value) ? 1 : -1);
        var ctx = document.getElementById('myChart').getContext("2d");
        var myChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: gradeData.map((gradeData) => gradeData.name),
                datasets: [{
                    label: '# of Votes',
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
                            beginAtZero: true
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

            var myDoughnutChart = new Chart(ctx, {
                type: 'doughnut',
            data: {
                labels: faultData.map((faultData) => faultData.name),
                datasets: [{
                    label: '# of Votes',
                    data: faultData.map((faultData) => faultData.value),
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
                            beginAtZero: true
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
  
