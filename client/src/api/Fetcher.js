
const Fetcher = async (login, project, query) => {

    const response = await fetch(login.host + "/carriageway", {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            "authorization": login.token,
            'Accept': 'application/json',
            'Content-Type': 'application/json',        
        },
        body: JSON.stringify({
            user: login.user,
            project: project,
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
const PostFetch = async (address, token, _body) => {
    const response = await fetch(address, {
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
        return {};
    } else {
        const body = await response.json();
        return body;
    }
}
export {Fetcher, PostFetch};

