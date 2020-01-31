'use strict'
import Cookies from 'js-cookie';

module.exports = { 

    async login(e) {
        this.setState({showLogin: false});
        const response = await fetch('http://' + this.state.host + '/login', {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            //"authorization": this.state.token,
            'Accept': 'application/json',
            'Content-Type': 'application/json',        
          },
          body: JSON.stringify({
            user: this.userInput.value,
            key: this.passwordInput.value
          })
        });
        const body = await response.json();
        console.log(body);
        if (response.status !== 200) {
          throw Error(body.message) 
        } 
        
        if (body.result) {
          console.log("Login succeded");
          Cookies.set('token', body.token, { expires: 7 })
          Cookies.set('user', body.user, { expires: 7 })
          this.setState({login: body.user});
          this.setState({token: body.token});
          this.setState({loginModal: (e) => this.logout(e)}); 
          //console.log(body.projects);     
          this.buildProjects(body.projects);   
        } else {
          console.log("Login failed");
        }  
      }
}