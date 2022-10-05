//const schedule = require('node-schedule');

// schedule.scheduleJob('0 0 6 * * *', async () => {
//   updateStatus();
// });

// const updateStatus = async () => {
//   let res = await db.urls();
//   let data = res.rows;
//   for (let url of data) {
//     let values = "";
    
//     axios.get(url.ramm)
//     .then(async (response) => {
//       let project = null;
//       let client = url.username;
//       if (client === 'rdc') {
//         project = 'RDC_RD_0521';
//       } else {
//         project = 'MDC_RD_0521';
//       }
//       let data = response.data.features;
//       for (let i = 0; i < data.length; i++) {
//         let status = data[i].properties.fault_status;
//         let id = "'" + project + "_" + String(data[i].properties.supplier_fault_id).padStart(5, '0') + "'";
//         if (status.toLowerCase() === "programmed") {
//           values += "(" + id + ", 'programmed'), ";
//         } else if (status.toLowerCase().includes("completed")) {
//           values += "(" + id + ", 'completed'), ";
//         } else if (status.toLowerCase() === "no action required") {
//           values += "(" + id + ", 'no action required'), ";
//         } 
//         if (i === data.length - 1) {
//           values = values.substring(0, values.length - 2)
//         }
//       }
//       let res = await db.updateStatus(project, values);
//       let message = `Updated ${res.rowCount} rows for ${project} @${new Date().toString()} \n`;
//       fs.appendFile('./log.txt', message, function (err) {
//         if (err) throw err;
//         console.log(message)
//       });
//     }).catch(error => {
//       console.log(error);
//     });
//   } 
// }