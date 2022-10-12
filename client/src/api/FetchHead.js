 const FetchHead = async (url) => {
    try {
      let response = await fetch(url, {
        method: 'HEAD', 
        mode: 'cors',   
      })
      //console.log(response)
      return response.status;
      } catch (err) { //cross-origin cors error photo exists
        return -1;
      } 
  }

  export { FetchHead }