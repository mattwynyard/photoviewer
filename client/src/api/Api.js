const apiRequest = async (credentials, request, endpoint) => {
    try {
        const response = await fetch('https://' + credentials.host + endpoint, {
        method: 'POST',
        headers: {
          "authorization": credentials.token,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: credentials.user,
          project: request.project,
          query: request.query,
        })
        });
        if(response.ok) {
          const body = await response.json();
          if (!body.result) {
            alert(body.error)
            return body;
          } else {
            return body.result;            
          }     
        } else {
          handleError({response})
          return {error: response};
        }
      } catch (error) {
        handleError(error);
      }
    }

    /**Generic async fetch
 * 
 * @param {string - host + endpoint} address 
 * @param {string} token 
 * @param {object} _body 
 * @returns 
 */

 export default async function LoginFetch(address, token, _body) {

  try {
      const response = await fetch("https://" + address, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
          "authorization": token,
          'Accept': 'application/json',
          'Content-Type': 'application/json',        
      },
      body: JSON.stringify(_body)
    });
    if(response.ok) {
      const body = await response.json();
      if (!body.result) {
        return {error: "login error"};
      } else {
        return body;            
      }     
    } else {
      handleError({response})
      return {error: response};
    }
  } catch (error) {
    handleError(error); 
  }
}

const handleError = (error) => {
      if (error instanceof TypeError) {
        alert(`Error: ${error.message} \nThe server maybe offline`);
        return;
      }
      if (!error.ok) {
        alert(`Error: ${error.status} \n${error.statusText}`);
      } else {
        alert(error)
      }
    }

export { apiRequest, LoginFetch }
