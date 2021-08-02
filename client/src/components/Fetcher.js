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

export {Fetcher};

