export default function apiRequest(request, ) {
    try {
        const response = await fetch('https://' + request.host + request.endpoint, {
        method: 'POST',
        headers: {
          "authorization": request.token,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: request.user,
          project: request.project,
        })
        });
        if(response.ok) {
          const body = await response.json();
          if (body.error != null) {
            return body.error;
          } else {
            return body.result;            
          }     
        } else {
          console.log(response);
          return response;
        }
      } catch (error) {
        return error;
      }
    }
