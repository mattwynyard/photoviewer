const Fetcher = async (address, login, query) => {

    const response = await fetch("https://" + address, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            "authorization": login.token,
            'Accept': 'application/json',
            'Content-Type': 'application/json',        
        },
        body: JSON.stringify({
            user: login.user,
            project: login.project,
            query: query
        })
    });
    const body = await response.json();
    return body;
}

/**
 * Generic post call to server
 * @param {url for localhost or webserver} address 
 * @param {client security token issued by server} token 
 * @param {josn body} _body 
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
        body: JSON.stringify(_body),      
    })
    if (!response.ok) {
        alert(`An error has occured: ${response.status}`);
        throw Error(`An error has occured: ${response.status}`);
    } else {
        const body = await response.json();
        return body;
    }
}
export {Fetcher, PostFetch};

