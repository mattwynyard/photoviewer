import { React, useContext, useEffect, useState } from 'react';
import { Dropdown }  from 'react-bootstrap';
import { CustomSVG } from '../components/CustomSVG.js';
import { loginContext } from '../login/loginContext'
import { PostFetch } from '../api/Fetcher';
/**
 * Fetches marker data from server using priority and filter
 * @param {String} project data to fetch
 */
//  filterLayer = async (project) => {
//   this.context.showLoader();
//   const body = this.getBody(project, this.context.login.user);
//   if (!body) return;
//   try {
//     const response = await fetch('https://' + this.context.login.host + '/layer', {
//       method: 'POST',
//       headers: {
//         "authorization": this.context.login.token,
//         'Accept': 'application/json',
//         'Content-Type': 'application/json',
//     },
//     body: body
//     });
   
//     if(!response.ok) {
//       throw new Error(response.status);
//     } else {
//       const body = await response.json();
//       if (body.error != null) {
//         alert(body.error);
//         return body;
//       } else {
//         return body;
//       }     
//     }    
//   } catch (error) {
//     console.error(error);
//   }
              
// }



function parsePriority(id) {
    let priority = null
    if (id === "Signage") {
      priority = 99;
    } else if (id === "Completed") {
      priority = 98;
    } else if (id === "Programmed") {
      priority = 97;
    } else {
      let p = id.substring(id.length - 1, id.length)
      priority = parseInt(p);
    }
    return priority;
  }

  const onChange= () => {

  }

export default function PriorityDropdown(props) {
  //console.log(props)
    const { gl, login, hideLoader, showLoader } = useContext(loginContext);
    const [menu, setMenu] = useState(null);
    const [filter, setFilter] = useState([]);
    const [data, setData] = useState([]);
    const [active, setActive] = useState(false);
    const [title, setTitle] = useState("Priority");

    // useEffect(() => {
    //   const body = {user: login.user, project: props.layer, filter: filter}
    //   showLoader();
    //   const response = PostFetch(login.host + "/layer", login.token, body);
    //   response.then((res) => {
    //       if (res.success) {
    //           setData(res.data);
    //           console.log(data)
    //       }
    //       hideLoader();
    //   })
    // }, [filter, PostFetch])

    const getBody = (project, user) => {
      let query = []
      if (project.surface === "road") {
        filter.forEach(item => {
          let data = [...item.data];
          query = query.concat(data);
        })
        return JSON.stringify({
          user: user,
          project: project.code,
          filter: filter,
          priority: this.state.filterPriorities,
          archive: project.isarchive,
          surface: project.surface,
          rmclass: this.state.filterRMClass,
          inspection: this.state.inspections,
        })   
      } else {
          return JSON.stringify({
            user: this.context.login.user,
            project: project.code,
            filter: this.state.filters,
            surface: project.surface,
            archive: project.isarchive,
            priority: this.state.filterPriorities,
            rmclass: this.state.filterRMClass,
            inspection: this.state.inspections,
          })
        }       
    }


    const isChecked = (value, parse) => {
        let priority = null;
        if (parse) {
          priority = parsePriority(value);
        } else {
          priority = value;
        }
        if (props.filter.includes(priority)) {
          return true;
        } else {
          return false;
        }  
      }

    const onRootClick = (e) => {

    }

    useEffect(() => {
      if (props.menu) setMenu(props.menu)
    }, [data])

    /**
   * Adds or removes priorities to array for db query
   * @param {the button clicked} e 
   */
   /**
   * Adds or removes priorities to array for db query
   * @param {the button clicked} e 
   */
    const onClick = (e, value) => {
        e.preventDefault();
        let query = [...props.filter]
        let parsedValue = parsePriority(value);
        if (query.length === 1) {
            if (query.includes(parsedValue)) {
                return;
            } else {
                query.push(parsedValue);
                props.onClick(query)
            }
        } else {
            if (query.includes(parsedValue)) {
                const index = query.indexOf(parsedValue);
                query.splice(index, 1);
            } else {
                query.push(parsedValue)
            }
            props.onClick(query)
        }   
    }
    
    return (
      <div className={props.className}>
        <Dropdown drop='end'>
            <Dropdown.Toggle variant="light" size="sm" >
              <input
                type="checkbox" 
                onClick={(e) => onRootClick(e)}
              >
              </input>
              <span>{props.title}</span> 
            </Dropdown.Toggle>
            <Dropdown.Menu className="custommenu" style={{ margin: 0 }}>
                {props.items.map((value, index) =>
                <div 
                    key={`${index}`}
                    >
                    <CustomSVG 
                      login={props.login}
                      value={value}
                      reverse={props.reverse}
                    >
                    </CustomSVG>
                    <input
                        key={`${index}`} 
                        id={value} 
                        type="checkbox" 
                        checked={isChecked(value, true)} 
                        onChange={onChange} 
                        onClick={(e) => onClick(e, value)}>
                    </input>{" " + value}
                    <br></br>
                </div> 
                )}
            </Dropdown.Menu>
        </Dropdown>
      </div>
    );
}