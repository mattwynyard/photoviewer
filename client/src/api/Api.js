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
          if (body.error != null) {
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

export { apiRequest }
