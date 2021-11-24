/**Generic async fetch
 * 
 * @param {string - host + endpoint} address 
 * @param {string} token 
 * @param {object} _body 
 * @returns 
 */

 export default async function PostFetch(address, token, _body) {

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
    const body = await response.json();
    if (response.status !== 200) {
      alert(response.status + " " + response.statusText);  
      throw Error(body.message);   
    } 
    return body;
}
